const express = require("express");// Gets input from the user in JSON format
const mysql = require("mysql"); // Connects to MySQL database
const cors = require("cors"); // Used to send requests to the Python backend for code generation and modification
const axios = require("axios"); // Axios for making HTTP requests to Python backend

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tiger",
  database: "react_mysql_db",
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

    // Call the Python backend to handle the task
    if (option === "Generate Code") {
      // Make a request to the Python backend for code generation
      pythonResponse = await axios.post("http://localhost:8000/process-request", {
        taskType: "generate",
        prompt: codePrompt,
      });
    } 
    else if (option === "Modify Code") {
      // Make a request to the Python backend for code modification
      pythonResponse = await axios.post("http://localhost:8000/process-request", {
        taskType: "modify",
        prompt: modifyCode,
      });
    }

    // Store the user option in the database
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

// Start the server on port 5003
app.listen(5003, () => console.log("Server running on port 5003"));