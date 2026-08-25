// Converte o arquivo recebido pelo multer (memoryStorage, ou seja,
// req.file.buffer) em uma data URI (ex: "data:image/png;base64,....").
// As views (item.ejs, produtos.ejs, perfil.ejs, etc.) já sabiam reconhecer
// esse formato antes desta mudança (checam `imagem.startsWith('data:')`),
// então basta salvar essa string direto na coluna `imagem`/`foto` do banco.
function arquivoParaDataUri(file) {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

module.exports = { arquivoParaDataUri };
