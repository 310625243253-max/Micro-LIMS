import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200, meta?: any): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  details?: any
): Response {
  const payload: ApiResponse = {
    success: false,
    error,
    details,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}
