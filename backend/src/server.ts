import 'dotenv/config';
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflowRoutes';
import executionRoutes from './routes/executionRoutes';
import workflowRequestRoutes from './routes/workflowRequestRoutes';
import supportTicketRoutes from './routes/supportTicketRoutes';
import settingsRoutes from './routes/settingsRoutes';
import adminRoutes from './routes/adminRoutes';
import assetsRoutes from './routes/assetsRoutes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for correct IP detection behind nginx
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:5173'],
    }
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin images
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/executions', executionRoutes);
app.use('/api/v1/workflow-requests', workflowRequestRoutes);
app.use('/api/v1/support-tickets', supportTicketRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server if called directly
if (require.main === module) {
  app.listen(PORT, () => {
    logger.debug(`🚀 Server running on port ${PORT}`);
    logger.debug(`📡 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
