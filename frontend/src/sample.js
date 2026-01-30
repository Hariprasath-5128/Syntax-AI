import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState("login");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [language, setLanguage] = useState("");
  const [codePrompt, setCodePrompt] = useState("");
  const [modifyCode, setModifyCode] = useState("");
  const [modifyLogic, setModifyLogic] = useState(""); 
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false); // New loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Show loader

    try {
      const response = await axios.post("http://localhost:5003/auth", {
        username,
        password,
        action,
      });

      setLoading(false); // Hide loader
      if (response.data.success) {
        setMessage(response.data.message);
        setIsLoggedIn(true);
        setUserId(response.data.userId);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error connecting to the server.");
    }
  };

  const handleOptionSubmit = async () => {
    setLoading(true); // Show loader before request

    try {
      let finalPrompt = "";

      if (selectedOption === "Generate Code") {
        finalPrompt = Generate code for ${codePrompt};
        if (language) {
          finalPrompt += ` in ${language}`;
        }
      } else if (selectedOption === "Modify Code") {
        if (modifyLogic && modifyCode) {
          finalPrompt = ${modifyLogic} the following code:\n\n${modifyCode};
        } else {
          finalPrompt = Modify the following code:\n\n${modifyCode};
        }
      }

      const response = await axios.post("http://localhost:5003/store-option", {
        userId,
        option: selectedOption,
        language,
        codePrompt: finalPrompt,
        modifyCode: finalPrompt,
        modifyLogic,
      });

      setLoading(false); // Hide loader after response
      setMessage(response.data.message);
    } catch (error) {
      setLoading(false);
      setMessage("Error storing data.");
    }
  };

  return (
    <div className="container">
      {!isLoggedIn ? (
        <div className="login-container">
          <h1>{action === "login" ? "Login" : "Sign Up"}</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{action === "login" ? "Login" : "Sign Up"}</button>
          </form>
          <button onClick={() => setAction(action === "login" ? "signup" : "login")}>
            {action === "login" ? "Create an account" : "Already have an account? Login"}
          </button>
          <p>{message}</p>
        </div>
      ) : (
        <div className="options-container">
          <h1>Choose an Option</h1>
          <button onClick={() => setSelectedOption("Generate Code")}>Generate Code</button>
          <button onClick={() => setSelectedOption("Modify Code")}>Modify Code</button>

          {selectedOption === "Generate Code" && (
            <div>
              <h2>Generate Code</h2>
              <select onChange={(e) => setLanguage(e.target.value)}>
                <option value="">Select Language</option>
                <option value="Python">Python</option>
                <option value="JavaScript">JavaScript</option>
                <option value="C++">C++</option>
                <option value="Java">Java</option>
              </select>
              <textarea
                placeholder="Enter code prompt"
                value={codePrompt}
                onChange={(e) => setCodePrompt(e.target.value)}
              />
              <br />
              <button onClick={handleOptionSubmit}>Submit</button>
            </div>
          )}

          {selectedOption === "Modify Code" && (
            <div>
              <h2>Modify Code</h2>
              <textarea
                placeholder="Enter existing code"
                value={modifyCode}
                onChange={(e) => setModifyCode(e.target.value)}
              />
              <select value={modifyLogic} onChange={(e) => setModifyLogic(e.target.value)}>
                <option value="">Select Modification Type</option>
                <option value="Refactor">Refactor</option>
                <option value="Modernize">Modernize</option>
                <option value="Error Correction">Error Correction</option>
              </select>
              <br />
              <button onClick={handleOptionSubmit}>Submit</button>
            </div>
          )}

          <button onClick={() => setIsLoggedIn(false)}>Logout</button>
          <p>{message}</p>
        </div>
      )}

      {/* Show loader while waiting for response */}
      {loading && <div className="loader"></div>}
    </div>
  );
}

export default App;