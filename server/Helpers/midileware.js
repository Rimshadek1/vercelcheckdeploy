const cookieParser = require('cookie-parser');

module.exports = function (req, res, next) {
    // Parse the cookies from the request headers
    const cookies = cookieParser.signedCookies(req.headers.cookie);

    // Set the cookies on the request object
    req.cookies = cookies;

    next();
};
