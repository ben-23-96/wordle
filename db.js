const mysql = require('mysql2/promise');
require('dotenv').config()


try {
    var pool = mysql.createPool({
        host: process.env.HOST_DB,
        user: process.env.USER_DB,
        password: process.env.PASSWORD_DB,
        database: process.env.DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })
    console.log('databse connection pool created')
} catch (err) {
    console.error(err)
}

module.exports = pool; 