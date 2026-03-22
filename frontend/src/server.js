const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "react_mysql_db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database.");
  }
});

// Authentication route for login/signup
app.post("/auth", (req, res) => {
  const { username, password, action } = req.body;

  if (action === "signup") {
    db.query(
      "INSERT INTO user_data (username, password) VALUES (?, ?)",
      [username, password],
      (err, results) => {
        if (err) {
          res.json({ success: false, message: "Signup failed. Username might already exist." });
        } else {
          res.json({ success: true, message: "Signup successful!", userId: results.insertId });
        }
      }
    );
  } else {
    db.query(
      "SELECT * FROM user_data WHERE username = ? AND password = ?",
      [username, password],
      (err, results) => {
        if (results.length > 0) {
          res.json({ success: true, message: "Login successful!", userId: results[0].id });
        } else {
          res.json({ success: false, message: "Invalid credentials." });
        }
      }
    );
  }
});

// Route to store user option data
app.post("/store-option", async (req, res) => {
  const { userId, option, language, codePrompt, modifyCode, modifyLogic } = req.body;

  try {
    let pythonResponse = null;

    if (option === "Generate Code") {
      pythonResponse = await axios.post("http://localhost:8000/process-request", {
        taskType: "generate",
        prompt: codePrompt,
      });
    }
    else if (option === "Modify Code") {
      pythonResponse = await axios.post("http://localhost:8000/process-request", {
        taskType: "modify",
        prompt: modifyCode,
      });
    }

    if (option === "Generate Code") {
      db.query(
        "INSERT INTO user_data (username, password, user_option, generate_code_prompt, generate_code_language, modify_code_input, modify_code_logic) SELECT username, password, ?, ?, ?, NULL, NULL FROM user_data WHERE id = ?",
        [option, codePrompt, language, userId],
        (err) => {
          if (err) {
            res.json({ success: false, message: "Failed to store Generate Code data." });
          } else {
            res.json({ success: true, message: "Generate Code data stored successfully!", aiOutput: pythonResponse.data.result });
          }
        }
      );
    } else if (option === "Modify Code") {
      db.query(
        "INSERT INTO user_data (username, password, user_option, generate_code_prompt, generate_code_language, modify_code_input, modify_code_logic) SELECT username, password, ?, NULL, NULL, ?, ? FROM user_data WHERE id = ?",
        [option, modifyCode, modifyLogic, userId],
        (err) => {
          if (err) {
            res.json({ success: false, message: "Failed to store Modify Code data." });
          } else {
            res.json({ success: true, message: "Modify Code data stored successfully!", aiOutput: pythonResponse.data.result });
          }
        }
      );
    }
  } catch (error) {
    console.error("Error communicating with Python backend:", error);
    res.json({ success: false, message: "Error generating code. Please try again later." });
  }
});

// Route to analyze code efficiency with scores for visual charts
app.post("/analyze-code", async (req, res) => {
  const { userId, originalCode, modifiedCode } = req.body;

  try {
    const analysisPrompt = `You are a code efficiency analyzer. Compare the ORIGINAL and MODIFIED code below and provide a detailed efficiency analysis.

ORIGINAL CODE:
${originalCode}

MODIFIED CODE:
${modifiedCode}

IMPORTANT: You MUST include numerical scores in your analysis. Use the exact format "Label: X/10" for each metric. Include ALL of the following scored sections:

TIME COMPLEXITY:
- Time Original: [score]/10 — [analysis]
- Time Modified: [score]/10 — [analysis]
- Best/Average/Worst case analysis

SPACE COMPLEXITY:
- Space Original: [score]/10 — [analysis]
- Space Modified: [score]/10 — [analysis]

EXECUTION SPEED:
- Speed Original: [score]/10 — [assessment]  
- Speed Modified: [score]/10 — [assessment]
- Bottlenecks identified

CODE READABILITY:
- Readability Original: [score]/10 — [assessment]
- Readability Modified: [score]/10 — [assessment]

MAINTAINABILITY:
- Maintainability Original: [score]/10 — [assessment]
- Maintainability Modified: [score]/10 — [assessment]

BEST PRACTICES:
- Practices Original: [score]/10 — [compliance]
- Practices Modified: [score]/10 — [compliance]

SUMMARY: [Overall comparative summary]

OVERALL EFFICIENCY SCORE: [score]/10 — [brief justification]

Higher scores = better efficiency. Be precise with your /10 ratings.`;

    const pythonResponse = await axios.post("http://localhost:8000/process-request", {
      taskType: "analyze",
      prompt: analysisPrompt,
    });

    res.json({
      success: true,
      message: "Analysis complete!",
      analysisResult: pythonResponse.data.result,
    });
  } catch (error) {
    console.error("Error analyzing code:", error);
    res.json({ success: false, message: "Error analyzing code. Please try again later." });
  }
});

// Start the server on port 5003
app.listen(5003, () => console.log("Server running on port 5003"));
