import { Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types';

let authService: AuthService;

const getAuthService = () => {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = parts[1];
    const user = getAuthService().validateToken(token);

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Export for testing
export const __setAuthService = (service: AuthService) => {
  authService = service;
};
