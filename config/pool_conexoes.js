const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'produtos').toLowerCase(),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    // Reduzido de 10 para 3: o banco (plano gratuito) só permite 5 conexões
    // simultâneas NO TOTAL para este usuário, e o session store (MySQLStore,
    // no app.js) abre seu próprio pool separado apontando pro mesmo banco.
    // 3 (app) + 2 (sessão) = 5, deixando ambos dentro do limite.
    connectionLimit: 3,
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

module.exports = pool.promise();