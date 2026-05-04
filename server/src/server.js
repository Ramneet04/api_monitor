import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './shared/config/index.js';
import logger from './shared/config/logger.js';
import mongodb from './shared/config/mongodb.js';
import postgres from './shared/config/postgres.js';
import rabbitmq from './shared/config/rabbitmq.js';
import errorHandler from './shared/middlewares/errorHandler.js';
import ResponseFormatter from './shared/utils/responseFormatter.js';
import cookieParser from "cookie-parser"

const app = express();

app.use(helmet()); // helmet is used to set various HTTP headers for security purposes. It helps protect the app from common vulnerabilities by configuring headers like Content-Security-Policy, X-Content-Type-Options, and more. prevent cross site scripting, clickjacking, and other attacks.
app.use(cors());
app.use(express.json()); // req.body() to parse JSON request bodies
app.use(cookieParser()) 
app.use(express.urlencoded({ extended: true }));


app.use((req,res,next)=>{
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent']  
    })
    next()
})

app.get('/health', (req, res) => {
    res.status(200).json(
        ResponseFormatter.success(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(), 
            },
            'Service is healthy'
        )
    );
});

app.get("/", (req, res) => {
    res.status(200).json(
        ResponseFormatter.success(
            {
                service: 'API Hit Monitoring System',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    ingest: '/api/hit',
                    analytics: '/api/analytics',
                },
            },
            'API Hit Monitoring Service'
        )
    )
});

app.use((req, res) => {
    res.status(404).json(ResponseFormatter.error("Endpoint not found", 404))
})

app.use(errorHandler);

async function initializeConnection() {
    try {
        logger.info("Initializing database connections...");

        await mongodb.connect();

        await postgres.testConnection();

        await rabbitmq.connect();

        logger.info("All connections established successfully");
    } catch (error) {
        logger.error("Failed to initialize connections:", error);
        throw error;
    }
}

async function startServer(){
    try {
        await initializeConnection();

        const server = app.listen(config.port, () => {
            logger.info(`Server started on port ${config.port}`);
            logger.info(`Environment: ${config.node_env}`);
            logger.info(`API available at: http://localhost:${config.port}`);
        });

        const gracefulShutdown = async () => {
            logger.info("Received shutdown signal, closing server...");
            
            server.close(async () => {
                logger.info("HTTP server closed");

                try {
                    await mongodb.disconnect();np
                    await postgres.close();
                    await rabbitmq.close();
                    logger.info('All connections closed, exiting process');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during shutdown:', error);
                    process.exit(1);
                }
            })

            setTimeout(() => {
                logger.error("Could not close connections in time, forcing shutdown");
                process.exit(1);
            }, 10000); 
        }

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();