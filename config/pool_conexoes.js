const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'produtos').toLowerCase(),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
   
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 2,
    maxIdle: 1,
    idleTimeout: 10000,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
    // Evita ECONNRESET por timeout do servidor MySQL
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    waitForConnections: true,
    connectTimeout: 10000,
});

// A rede local pode interceptar/atrasar o handshake TLS de forma intermitente,
// então tenta algumas vezes antes de reportar falha (a pool em si já reconecta
// sozinha nas próximas queries, isso aqui é só o log de diagnóstico do startup).
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

// Fecha as conexões ao encerrar o processo (Ctrl+C, restart do deploy),
// senão elas ficam presas no servidor MySQL até expirarem e ocupam o limite.
let encerrando = false;
function encerrarPool(sinal) {
    if (encerrando) return;
    encerrando = true;
    pool.end(() => process.kill(process.pid, sinal));
    setTimeout(() => process.exit(0), 3000).unref();
}
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((sinal) => {
    process.once(sinal, () => encerrarPool(sinal));
});

module.exports = pool.promise();