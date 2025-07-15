const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];  // key value pair in header
    const token = authHeader && authHeader.split(' ')[1];  // get token from authorization header: is in the format 'Bearer <token>'

    if(!token) {
        return res.status(401).json({error: 'Access denied. No token provided.'})
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {  // verify token
        if (err) {
            return res.status(403).json({error: 'Invalid or expired token.'});
        }
        req.user = user;  // attach user info (obj) to req object
        next();  // pass control to the next handler (route handler)
    });
}

module.exports = authenticateToken;