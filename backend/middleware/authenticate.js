const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// ✅ Middleware to Verify User
const verifyUser = async (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "Authentication required" });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.userId });
  
      if (!user) return res.status(401).json({ error: "User not found" });
  
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid authentication" });
    }
  };

// ✅ Middleware to Check if Verified User
const isVerifiedUser = async (req, res, next) => {
    if (!req.user?.isVerified) {
        return res.status(403).json({ error: "Please verify your email first." });
    }
    next();
};

// ✅ Middleware for Admin Check
const verifyAdmin = async (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Access denied! Admins only." });
    }
    next();
};

module.exports = { verifyUser, isVerifiedUser, verifyAdmin };
