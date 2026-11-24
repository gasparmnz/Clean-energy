const OCIOSA_MS = 2000;
const IDLE_TIMEOUT_MS = 60000;

function opcoesPool(connectionLimit) {
  return {
    connectionLimit,
    maxIdle: Math.max(0, connectionLimit - 1),
    idleTimeout: IDLE_TIMEOUT_MS
  };
}

function validarConexoesOciosas(pool) {
  const getConnectionOriginal = pool.getConnection.bind(pool);

  pool.getConnection = function getConnectionValidada(cb, tentativa = 1) {
    getConnectionOriginal((err, conn) => {
      if (err) return cb(err);

      const parada = Date.now() - (conn.lastActiveTime || 0);
      if (parada < OCIOSA_MS) return cb(null, conn);

      conn.ping((erroPing) => {
        if (!erroPing) return cb(null, conn);
        try { conn.destroy(); } catch (e) { }
        if (tentativa >= 3) return cb(erroPing);
        pool.getConnection(cb, tentativa + 1);
      });
    });
  };

  return pool;
}

const CODIGOS_CONEXAO_PERDIDA = new Set([
  'ECONNRESET', 'EPIPE', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'
]);
function erroDeConexaoPerdida(err) {
  return !!err && CODIGOS_CONEXAO_PERDIDA.has(err.code);
}

module.exports = { opcoesPool, validarConexoesOciosas, erroDeConexaoPerdida };
