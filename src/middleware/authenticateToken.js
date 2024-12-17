const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model
const JWT_SECRET = "secret"; // The secret key

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Token is missing.' });
    }

    try {
        // Decode the token to extract userId
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user in the database and check activeToken
        const user = await User.findById(decoded.userId);

        if (!user || user.activeToken !== token) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // Attach the user data to the request object
        req.user = { userId: user._id, email: user.email };
        next(); // Proceed to the next middleware or route
    } catch (err) {
        console.error('Error validating token:', err);
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authenticateToken;
