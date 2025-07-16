const express = require('express');
const cors = require('cors');
const path = require('path');
const promClient = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const port = process.env.PORT || 5000

//middleware
app.use(cors());
app.use(express.json());

// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const requestCounter = new promClient.Counter({
    name: 'http_request_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
});

// Middleware to count requests
app.use((req, res, next) => {
    requestCounter.inc({ method: req.method, route: req.path, status: res.statusCode});
    next();
})

// Routes
app.get('/api/greeting', (req, res) => {
    res.json({ message: "Hello from backend!" });
});

app.get('/health', (req, res) => {
    res.json({ status: "UP" });
});

app.get('/readiness', (req, res) => {
    res.json({ ready: true});
});

app.get('/devsecops-info', (req, res) => {
    res.json({
        platform: 'Demo DevSecOps Automation',
        tools: ['Prometheus', 'Grafana', 'Trivy', 'Swagger'],
        environment: process.env.NODE_ENV || 'development',
    });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Backend running from http://localhost:${port}`)
});