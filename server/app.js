const express = require('express');
const cookieParser = require('cookie-parser');
const cookieParserMiddleware = require('./Helpers/cookie');

const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const fileUpload = require('express-fileupload');
const indexRouter = require('./routes/index');
const db = require('./config/connection');
const createError = require('http-errors');


const app = express();
app.use(cookieParser());
app.use(cookieParserMiddleware);
const corsOptions = {
    origin: 'https://rimshad.tech',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204, // For preflight requests
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));





app.use('/public', express.static(__dirname + '/public'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use('/', indexRouter);
app.use(bodyParser.json());
require('dotenv').config();




// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

const Port = process.env.PORT

db.connect((err) => {
    if (err)
        console.log('error ' + err);
    else
        app.listen(Port, () => {
            console.log(`Server is running at ${Port}`);
        });
    console.log("Database connected");
});
