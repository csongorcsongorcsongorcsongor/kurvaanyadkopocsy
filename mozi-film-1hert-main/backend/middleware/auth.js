const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); 

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        logger.warn('No token provided'); // Logolás
        return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.userId;
        logger.info(`User authenticated: ${req.user}`); // Logolás
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            logger.warn('Token expired'); // Logolás
            return res.status(401).json({ success: false, message: 'Token expired, please log in again' });
        }
        logger.error('Invalid token', { error: err.message }); // Logolás
        return res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

module.exports = auth;