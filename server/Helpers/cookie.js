const cookieParser = require('cookie-parser');
const jwtsecret = process.env.JWTSECRET
const express = require('express');
const app = express();
app.use((req, res, next) => {
    console.log('Request cookies:', req.cookies);

    // Use cookie-parser middleware
    cookieParser(jwtsecret)(req, res, (err) => {
        if (err) {
            console.error('Cookie parser error:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Continue to the next middleware or route
        next();
    });
});

// ... other middleware and routes
