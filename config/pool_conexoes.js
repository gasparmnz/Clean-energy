const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'produtos').toLowerCase(),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('Erro de conexão MySQL:', err.message);
    } else {
        console.log('Conectado ao SGBD!');
        conn.release();
    }
});

module.exports = pool.promise();