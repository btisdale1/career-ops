const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const yaml = require('js-yaml');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Path to data files
const BASE_PATH = '/Users/home/Github/career-ops';
const DATA_PATH = path.join(BASE_PATH, 'data');
const REPORTS_PATH = path.join(BASE_PATH, 'reports');
const PROFILE_PATH = path.join(BASE_PATH, 'config/profile.yml');
const CV_PATH = path.join(BASE_PATH, 'cv.md');

app.get('/api/applications', (req, res) => {
    const filePath = path.join(DATA_PATH, 'applications.md');
    console.log(`Reading applications from: ${filePath}`);
    const stream = fs.createReadStream(filePath, 'utf8');
    let data = '';
    stream.on('data', (chunk) => data += chunk);
    stream.on('end', () => res.json({ content: data }));
    stream.on('error', (err) => {
        console.error(`Read error: ${err.message}`);
        res.status(500).json({ error: `Failed to read applications data: ${err.message}` });
    });
});

app.get('/api/reports/:filename', (req, res) => {
    const filePath = path.join(REPORTS_PATH, req.params.filename);
    console.log(`Reading report from: ${filePath}`);
    const stream = fs.createReadStream(filePath, 'utf8');
    let data = '';
    stream.on('data', (chunk) => data += chunk);
    stream.on('end', () => res.json({ content: data }));
    stream.on('error', (err) => {
        console.error(`Read error: ${err.message}`);
        res.status(500).json({ error: `Failed to read report: ${err.message}` });
    });
});

app.post('/api/command', (req, res) => {
    const { command, args } = req.body;
    const cmdString = `node -e "const { execSync } = require('child_process'); console.log(execSync('${command} ${args || ''}').toString())"`;
    exec(cmdString, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Command failed' });
        }
        res.json({ output: stdout });
    });
});

app.get('/api/profile', (req, res) => {
    try {
        const data = fs.readFileSync(PROFILE_PATH, 'utf8');
        res.json({ content: yaml.load(data) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read profile' });
    }
});

app.post('/api/profile', (req, res) => {
    try {
        fs.writeFileSync(PROFILE_PATH, yaml.dump(req.body));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

app.get('/api/cv', (req, res) => {
    try {
        const data = fs.readFileSync(CV_PATH, 'utf8');
        res.json({ content: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read CV' });
    }
});

app.post('/api/cv', (req, res) => {
    try {
        fs.writeFileSync(CV_PATH, req.body.content);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save CV' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
