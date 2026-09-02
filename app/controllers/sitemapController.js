const BASE_URL = 'https://clean-energy.onrender.com';

exports.getSitemap = async (req, res) => {
    try {

        res.type('application/xml');

        res.send(`<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <url>
        <loc>${BASE_URL}/</loc>
    </url>

    <url>
        <loc>${BASE_URL}/home</loc>
    </url>

    <url>
        <loc>${BASE_URL}/transporte</loc>
    </url>

    <url>
        <loc>${BASE_URL}/sobre_nos</loc>
    </url>

    <url>
        <loc>${BASE_URL}/adicione_produto</loc>
    </url>

    <url>
        <loc>${BASE_URL}/duvidas</loc>
    </url>

</urlset>`);

    } catch (error) {
        console.error('Erro ao gerar sitemap:', error);
        res.status(500).send('Erro ao gerar sitemap');
    }
};