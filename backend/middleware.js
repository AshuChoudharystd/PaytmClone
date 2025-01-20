const JWT_SECRET = 'AshuJaat';
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if authorization header is missing or doesn't start with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "Forbidden: No token provided or incorrect format"
        });
    }

    const token = authHeader.split(' ')[1]; // Extract the token

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if token contains userId
        if (decoded.userId) {
            req.userId = decoded.userId; // Set the userId in request for future use
            next(); // Call the next middleware or route handler
        } else {
            return res.status(403).json({
                message: "Forbidden: Invalid token payload"
            });
        }
    } catch (error) {
        // Handle invalid or expired token
        return res.status(403).json({
            message: "Forbidden: Invalid token"
        });
    }
};

module.exports = {authMiddleware,JWT_SECRET};