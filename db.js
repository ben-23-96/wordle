const mysql = require('mysql2');
require('dotenv').config()

const connection = mysql.createConnection({
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE
});

connection.connect(error => {
    if (error) {
        console.log("A error has been occurred "
            + "while connecting to database.");
        throw error;
    } else {
        console.log('connected to database')
    }
});

module.exports = connection; 