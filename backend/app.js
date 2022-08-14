const express = require('express');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/error');

require('dotenv').config();
require('./db');
require('express-async-errors');

const userRouter = require('./routes/user');
const app = express();
app.use(morgan('dev'));

// to parse the all incoming data into the JSON. Cause all incoming data is in chunk format.
app.use(express.json());

app.use('/api/user', userRouter);

app.get('/about', (req, res) => {
    res.send("heyyy ")
});

// error handeling in express. Try to put this block at the end of the routing -> generated error can be handleed properly.
app.use(errorHandler);

app.listen(8000, () => {
    console.log("port is listning on port 8000")
});