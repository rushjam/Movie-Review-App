const express = require('express');

const userRouter = require('./routes/user');
const app = express();
// to parse the all incoming data into the JSON. Cause all incoming data is in chunk format.
app.use(express.json());
app.use('/api/user', userRouter);

app.listen(8000, () => {
    console.log("port is listning on port 8000")
});