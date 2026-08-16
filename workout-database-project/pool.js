const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password: 'hello',
    database : 'testing'
});

module.exports = pool;