const express = require("express");
const { registerUser, loginUser, logoutUser, dumpUsers, fixAllPasswords } = require("../controllers/user");
const authenticate = require("../middleware/authenticate");
const router = express.Router();
const User = require("../models/User");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/logout", authenticate.verifyUser, logoutUser);

router.get("/dump", authenticate.verifyUser, authenticate.verifyAdmin, dumpUsers);  // Only admin can dump all users
router.post("/fix-passwords", authenticate.verifyUser, authenticate.verifyAdmin, fixAllPasswords);
router.post('/debug-login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Find user
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        console.log('User found:', user ? user.email : 'NOT FOUND');
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Password comparison debug
        console.log('Stored hash:', user.password);
        console.log('Hash type:', 
            user.password.startsWith('$2a$') ? 'bcrypt (2a)' :
            user.password.startsWith('$2b$') ? 'bcrypt (2b)' :
            'UNKNOWN FORMAT'
        );

        // 3. Perform comparison
        const isMatch = await bcrypt.compare(password.trim(), user.password);
        console.log('Comparison result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ error: "Password mismatch" });
        }

        // 4. Verify token generation
        const token = user.generateAuthToken();
        console.log('Generated token:', token);

        res.json({ success: true, token });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
