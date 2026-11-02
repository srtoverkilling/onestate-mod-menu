const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// Actual upstream API address.
// Do NOT put your own Render URL here.
const API_URL = process.env.ONESTATE_API_BASE_URL;

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'OneState backend is running'
    });
});

// Server health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        server: 'online',
        upstreamConfigured: Boolean(API_URL)
    });
});

// API connection test
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'OneState proxy is responding',
        upstreamConfigured: Boolean(API_URL)
    });
});

// API proxy
app.use('/api', async (req, res) => {
    if (!API_URL) {
        return res.status(503).json({
            success: false,
            error: 'Upstream API URL has not been configured'
        });
    }

    try {
        const path = req.originalUrl.replace(/^\/api/, '');

        const url = API_URL.replace(/\/+$/, '') + path;

        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.API_KEY
                    ? { 'X-API-Key': process.env.API_KEY }
                    : {})
            }
        });

        res.status(response.status).json(response.data);

    } catch (error) {
        res.status(error.response?.status || 502).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Render port
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log('OneState backend running on port ' + PORT);
});