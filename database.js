const mysql = require('mysql2/promise');

const conn = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'nextage',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = conn;










