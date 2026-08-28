import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JwtAuthPayload } from '../types/index.js';

export function signAccessToken(payload: JwtAuthPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '15m',
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): JwtAuthPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtAuthPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
}
