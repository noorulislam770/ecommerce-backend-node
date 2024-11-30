
const express = require('express')
const app = express();
const dotenv = require('dotenv')
const pool = require('./src/config/db.js')
dotenv.config();

app.use(express.json());


const port = process.env.PORT || 5000;


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})