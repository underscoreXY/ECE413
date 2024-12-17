var express = require('express');
var router = express.Router();
var db = require("../db");
var User = require("../models/User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register a new user
router.post("/register", function (req, res) {
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.status(401).json({ success: false, err: err });
        } else if (user) {
            res.status(401).json({ success: false, msg: "This email is already in use" });
        } else {
            const passwordHash = bcrypt.hashSync(req.body.password, 10);
            const newUser = new User({
                email: req.body.email,
                passwordHash: passwordHash // Save the hashed password
            });

            newUser.save(function (err, savedUser) {
                if (err) {
                    res.status(400).json({ success: false, err: err });
                } else {
                    const msgStr = "User (${req.body.email}) account has been created.";
                    res.status(201).json({ success: true, message: msgStr });
                    console.log(msgStr);
                }
            });
        }
    });
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user in the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify the password
        const isMatch = bcrypt.compareSync(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate a new token
        const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: '1h' });

        // Save the token in the database
        user.activeToken = token;
        await user.save();

        res.status(200).json({ token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});
module.exports = router;