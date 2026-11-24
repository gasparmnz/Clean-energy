function arquivoParaDataUri(file) {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

function srcImagem(imagem) {
  if (!imagem || typeof imagem !== 'string') return '/imagem/sem-foto.png';
  const valor = imagem.trim();
  if (!valor) return '/imagem/sem-foto.png';
  if (/^(data:|https?:\/\/|\/)/i.test(valor)) return valor;
  return '/imagem/' + valor.replace(/^imagem\//, '');
}

module.exports = { arquivoParaDataUri, srcImagem };
