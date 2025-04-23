require("dotenv").config();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // ✅ Set SendGrid API Key

// ✅ User Signup (Now without email verification)
const registerUser = async (req, res) => {
    try {
      const { email, password, characterName } = req.body;
      
      // Trim and validate
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      
      if (!cleanEmail || !cleanPassword || !characterName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const newUser = new User({
        email: cleanEmail,
        password: cleanPassword, // Let the model handle hashing
        characterName
      });

      const savedUser = await newUser.save();
      
      res.status(201).json({
        message: "Signup successful!",
        user: {
          _id: savedUser._id,
          email: savedUser.email,
          characterName: savedUser.characterName
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
};


// ✅ User Login
const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
  
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      // Enhanced debug output
      console.log('Password comparison debug:', {
        inputPassword: cleanPassword,
        storedHash: user.password,
        isBcryptHash: user.password.startsWith('$2a$') || user.password.startsWith('$2b$'),
        hashComponents: user.password.split('$') // Shows bcrypt components if properly hashed
      });
  
      const isMatch = await bcrypt.compare(cleanPassword, user.password);
      console.log('Bcrypt compare result:', isMatch);
      
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      // Use the model's method to generate token for consistency
      const token = user.generateAuthToken();
  
      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          characterName: user.characterName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
};
// Add this with your other exports
const fixAllPasswords = async (req, res) => {
    try {
        const users = await User.find();
        let fixedCount = 0;

        for (const user of users) {
            // Only fix if password doesn't look like a bcrypt hash
            if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
                console.log(`Fixing password for ${user.email}`);
                user.password = user.password.trim(); // Let the model's pre-save hook hash it
                await user.save();
                fixedCount++;
            }
        }

        res.json({ 
            message: `Fixed ${fixedCount} user passwords`,
            totalUsers: users.length,
            note: "Passwords that were already hashed were not modified"
        });
    } catch (error) {
        console.error("Password fix error:", error);
        res.status(500).json({ error: error.message });
    }
};



// ✅ User Logout
const logoutUser = async (req, res) => {
    res.status(200).json({ message: "User logged out successfully!" });
};

// ✅ Dump All Users (Admin Only)
const dumpUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("❌ Dump Users Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve users." });
    }
};

module.exports = { registerUser, loginUser, logoutUser, dumpUsers, fixAllPasswords };
