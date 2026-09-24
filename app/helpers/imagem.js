// Converte o arquivo recebido pelo multer (memoryStorage, ou seja,
// req.file.buffer) em uma data URI (ex: "data:image/png;base64,....").
// As views (item.ejs, produtos.ejs, perfil.ejs, etc.) já sabiam reconhecer
// esse formato antes desta mudança (checam `imagem.startsWith('data:')`),
// então basta salvar essa string direto na coluna `imagem`/`foto` do banco.
function arquivoParaDataUri(file) {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// Resolve o valor salvo na coluna `imagem` para um `src` válido de <img>.
// Aceita os formatos que já existem no banco: data URI, URL absoluta,
// caminho com "/imagem/..." ou apenas o nome do arquivo em public/imagem.
function srcImagem(imagem) {
  if (!imagem || typeof imagem !== 'string') return '/imagem/sem-foto.png';
  const valor = imagem.trim();
  if (!valor) return '/imagem/sem-foto.png';
  if (/^(data:|https?:\/\/|\/)/i.test(valor)) return valor;
  return '/imagem/' + valor.replace(/^imagem\//, '');
}

module.exports = { arquivoParaDataUri, srcImagem };
