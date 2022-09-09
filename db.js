const mysql = require('mysql2');
require('dotenv').config()


const pool = mysql.createPool({
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


pool.getConnection((err, connection) => {
    if (err) {
        console.log("A error has been occurred "
            + "while connecting to database.");
        throw err;
    }
    console.log('Database connected successfully');
    pool.releaseConnection(connection);
});

module.exports = pool; 