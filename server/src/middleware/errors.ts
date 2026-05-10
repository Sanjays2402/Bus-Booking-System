import { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// 404 fallback for unknown /api routes
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;
  const status = err?.status || err?.statusCode || 500;
  const payload: Record<string, unknown> = {
    error: err?.message || 'Internal server error',
  };
  if (err?.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    payload.stack = err?.stack;
  }
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json(payload);
}
