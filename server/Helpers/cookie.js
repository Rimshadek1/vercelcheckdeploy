// /var/task/server/Helpers/cookie.js

const cookieParser = require('cookie-parser');
const jwtsecret = process.env.JWTSECRET;

// Middleware function
const cookieMiddleware = (req, res, next) => {
    // Use cookie-parser middleware
    cookieParser(jwtsecret)(req, res, (err) => {
        if (err) {
            console.error('Cookie parser error:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Continue to the next middleware or route
        next();
    });
};

module.exports = cookieMiddleware;
