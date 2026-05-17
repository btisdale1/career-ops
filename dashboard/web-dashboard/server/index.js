const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const yaml = require('js-yaml');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Path to data files
const DATA_PATH = path.join(__dirname, '../../../../data');
const REPORTS_PATH = path.join(__dirname, '../../../../reports');
const PROFILE_PATH = path.join(__dirname, '../../../../config/profile.yml');
const CV_PATH = path.join(__dirname, '../../../../cv.md');

app.get('/api/applications', async (req, res) => {
    try {
        const filePath = path.join(DATA_PATH, 'applications.md');
        const data = await fs.readFile(filePath, 'utf8');
        res.json({ content: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read applications data' });
    }
});

app.get('/api/reports/:filename', async (req, res) => {
    try {
        const filePath = path.join(REPORTS_PATH, req.params.filename);
        const data = await fs.readFile(filePath, 'utf8');
        res.json({ content: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read report' });
    }
});

app.post('/api/scan', (req, res) => {
    const scanScript = path.join(__dirname, '../../../../scan.mjs');
    exec(`node ${scanScript}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Scan failed' });
        }
        res.json({ output: stdout });
    });
});

app.get('/api/profile', async (req, res) => {
    try {
        const data = await fs.readFile(PROFILE_PATH, 'utf8');
        res.json({ content: yaml.load(data) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read profile' });
    }
});

app.post('/api/profile', async (req, res) => {
    try {
        await fs.writeFile(PROFILE_PATH, yaml.dump(req.body));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

app.get('/api/cv', async (req, res) => {
    try {
        const data = await fs.readFile(CV_PATH, 'utf8');
        res.json({ content: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read CV' });
    }
});

app.post('/api/cv', async (req, res) => {
    try {
        await fs.writeFile(CV_PATH, req.body.content);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save CV' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
