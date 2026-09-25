// Torna um pool do mysql2 resistente a conexões derrubadas pelo servidor.
//
// O problema: o MySQL da Clever Cloud (como a maioria dos MySQL gerenciados)
// encerra em silêncio conexões que ficam paradas. O pool do mysql2 não
// percebe e, no próximo uso, entrega essa conexão morta -> a consulta falha
// com ECONNRESET / PROTOCOL_CONNECTION_LOST. Era isso que fazia aparecer a
// página "Estamos com instabilidade" depois de ficar alguns minutos
// preenchendo o cadastro de um produto; ao clicar em "Tentar novamente" o
// pool já tinha descartado a conexão quebrada e abria outra, então funcionava.
//
// Além disso, o mysql2 só descarta conexões ociosas quando
// maxIdle < connectionLimit — e por padrão maxIdle = connectionLimit, ou
// seja, conexões paradas nunca eram renovadas.
//
// A correção tem duas partes:
//  1. opcoesPool(): maxIdle menor que connectionLimit + idleTimeout, para o
//     próprio mysql2 fechar conexões paradas há muito tempo;
//  2. validarConexoesOciosas(): antes de entregar uma conexão que ficou
//     parada por mais de alguns segundos, faz um PING. Se a conexão estiver
//     morta, ela é descartada e outra é usada — a consulta da aplicação
//     nunca chega a ser enviada numa conexão quebrada (sem risco de repetir
//     um INSERT).

const OCIOSA_MS = 2000;        // conexões paradas há mais que isso recebem PING antes do uso
const IDLE_TIMEOUT_MS = 60000; // conexões paradas há mais que isso são fechadas pelo pool

function opcoesPool(connectionLimit) {
  return {
    connectionLimit,
    maxIdle: Math.max(0, connectionLimit - 1),
    idleTimeout: IDLE_TIMEOUT_MS
  };
}

// Recebe o pool "core" do mysql2 (o retornado por mysql.createPool, antes do
// .promise()). pool.query(), pool.execute() e pool.getConnection() — e,
// portanto, também a versão .promise() — passam a usar conexões validadas.
function validarConexoesOciosas(pool) {
  const getConnectionOriginal = pool.getConnection.bind(pool);

  pool.getConnection = function getConnectionValidada(cb, tentativa = 1) {
    getConnectionOriginal((err, conn) => {
      if (err) return cb(err);

      const parada = Date.now() - (conn.lastActiveTime || 0);
      if (parada < OCIOSA_MS) return cb(null, conn);

      conn.ping((erroPing) => {
        if (!erroPing) return cb(null, conn);
        // Conexão morta: remove do pool e tenta com outra (até 3 vezes).
        try { conn.destroy(); } catch (e) { /* já estava fechada */ }
        if (tentativa >= 3) return cb(erroPing);
        pool.getConnection(cb, tentativa + 1);
      });
    });
  };

  return pool;
}

// Erros de conexão perdida — seguros para repetir operações idempotentes
// (como as do armazenamento de sessões).
const CODIGOS_CONEXAO_PERDIDA = new Set([
  'ECONNRESET', 'EPIPE', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'
]);
function erroDeConexaoPerdida(err) {
  return !!err && CODIGOS_CONEXAO_PERDIDA.has(err.code);
}

module.exports = { opcoesPool, validarConexoesOciosas, erroDeConexaoPerdida };
