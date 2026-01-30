
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
