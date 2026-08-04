import express from 'express';
import models3dRouter from './models3dRouter.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar router de modelos 3D
app.use('/api/models', models3dRouter);

// Export Handler para Vercel Serverless & Express
export default function handler(req, res) {
  return app(req, res);
}

export { app };
