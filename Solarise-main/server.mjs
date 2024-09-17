import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; // Importing 'join' function from 'path'
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());
// Using 'join' function from 'path' to join __dirname with 'public' directory
app.use(express.static(join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: userMessage }],
                max_tokens: 150
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.send(data.choices[0].message.content.trim());
        } else {
            console.error('Error from OpenAI:', data.error);
            res.status(500).send(data.error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
