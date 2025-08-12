import { Request } from 'express';

export interface JWTPayload {
  username: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
}

export interface ErrorResponse {
  error: string;
}

