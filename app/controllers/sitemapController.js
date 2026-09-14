const produtosModel = require('../models/models.js');

const BASE_URL = 'https://clean-energy.onrender.com';

exports.getSitemap = async (req, res) => {
    try {

        // Busca todos os produtos ativos
        const produtos = await produtosModel.findAll({
            apenasAtivos: true
        });

        // URLs fixas do site
        const paginas = [
            '/',
            '/home',
            '/transporte',
            '/sobre_nos',
            '/adicione_produto',
            '/duvidas'
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

        // Adiciona as páginas fixas
        paginas.forEach(pagina => {
            xml += `
    <url>
        <loc>${BASE_URL}${pagina}</loc>
    </url>
`;
        });

        // Adiciona os produtos automaticamente
        produtos.forEach(produto => {
            xml += `
    <url>
        <loc>${BASE_URL}/item/${produto.id}</loc>
    </url>
`;
        });

        xml += `
</urlset>`;

        res.type('application/xml');
        res.send(xml);

    } catch (error) {

        console.error('Erro ao gerar sitemap:', error);

        res.status(500).send('Erro ao gerar sitemap');
    }
};