const mysql = require('mysql2');
const { opcoesPool, validarConexoesOciosas } = require('./mysql_resiliente');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'produtos').toLowerCase(),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    ...opcoesPool(3),
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    waitForConnections: true,
    connectTimeout: 10000,
});

validarConexoesOciosas(pool);

function testarConexao(tentativa = 1) {
    pool.getConnection((err, conn) => {
        if (err) {
            if (tentativa < 3) {
                setTimeout(() => testarConexao(tentativa + 1), 1500);
            } else {
                console.error('Erro de conexão MySQL:', err.message);
            }
        } else {
            console.log('Conectado ao SGBD!');
            conn.release();
        }
    });
}
testarConexao();

module.exports = pool.promise();