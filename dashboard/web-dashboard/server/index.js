const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Path to data files
const DATA_PATH = path.join(__dirname, '../../../../data');
const REPORTS_PATH = path.join(__dirname, '../../../../reports');

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

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
