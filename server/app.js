const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const fileUpload = require('express-fileupload');
const indexRouter = require('./routes/index');
const db = require('./config/connection');
const createError = require('http-errors');


const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


app.use('/public', express.static(__dirname + '/public'));
app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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
