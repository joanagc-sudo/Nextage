const mysql = require('mysql2/promise');

const conn = mysql.createPool({
    host: 'localhost',
    user: 'root',
    //password: 'admin',
    password: '1234',
    database: 'nextage',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = conn;










