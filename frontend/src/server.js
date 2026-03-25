const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const app = express();
app.use(express.json());
app.use(cors());

// Supabase (PostgreSQL) connection pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

db.on("connect", () => {
  console.log("Connected to Supabase (PostgreSQL) database.");
});

// Authentication route for login/signup
app.post("/auth", async (req, res) => {
  const { username, password, action } = req.body;

  try {
    if (action === "signup") {
      const results = await db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, password]
      );
      res.json({ success: true, message: "Signup successful!", userId: results.rows[0].id });
    } else {
      const results = await db.query(
        "SELECT id FROM users WHERE username = $1 AND password = $2",
        [username, password]
      );
      if (results.rows.length > 0) {
        res.json({ success: true, message: "Login successful!", userId: results.rows[0].id });
      } else {
        res.json({ success: false, message: "Invalid credentials." });
      }
    }
  } catch (err) {
    console.error("Database error details:", err);
    res.json({ success: false, message: `DB Error: ${err.message}` });
  }
});

// Route to store user option data
app.post("/store-option", async (req, res) => {
  const { userId, option, language, codePrompt, modifyCode, modifyLogic } = req.body;

  try {
    let pythonResponse = null;
    let finalPrompt = "";

    if (option === "Generate Code") {
      finalPrompt = codePrompt;
      const targetUrl = process.env.AI_AGENT_URL || "http://127.0.0.1:8000/process-request";
      console.log(`📡 Sending request to: ${targetUrl}`);
      pythonResponse = await axios.post(targetUrl, {
        taskType: "generate",
        prompt: finalPrompt,
      });
    }
    else if (option === "Modify Code") {
      finalPrompt = modifyCode;
      pythonResponse = await axios.post(process.env.AI_AGENT_URL || "http://127.0.0.1:8000/process-request", {
        taskType: "modify",
        prompt: finalPrompt,
      });
    }

    const aiOutput = pythonResponse.data.result;

    // Store in normalized activity table
    await db.query(
      "INSERT INTO user_activity (user_id, user_option, language, qn, modify_code_input, modify_code_logic, output) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        userId, 
        option, 
        language || null, 
        finalPrompt, 
        (option === "Modify Code" ? modifyCode : null),
        (option === "Modify Code" ? modifyLogic : null),
        aiOutput
      ]
    );

    res.json({ 
      success: true, 
      message: `${option} data stored successfully!`, 
      aiOutput: aiOutput 
    });

  } catch (error) {
    console.error("Error in store-option:", error);
    res.json({ success: false, message: "Error processing request." });
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

    const pythonResponse = await axios.post(process.env.AI_AGENT_URL || "http://localhost:8000/process-request", {
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
