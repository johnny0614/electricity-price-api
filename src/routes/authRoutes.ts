import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest, LoginResponse, ErrorResponse } from '../types';

export const authRouter = Router();

let authService: AuthService;

const getAuthService = () => {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
};

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Input validation
    if (
      !username ||
      !password ||
      username.trim() === '' ||
      password.trim() === ''
    ) {
      const errorResponse: ErrorResponse = {
        error: 'Username and password are required',
      };
      return res.status(400).json(errorResponse);
    }

    // Validate credentials
    const isValid = await getAuthService().validateCredentials(
      username,
      password
    );

    if (!isValid) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid credentials',
      };
      return res.status(401).json(errorResponse);
    }

    // Generate token
    const token = getAuthService().generateToken(username);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds

    const loginResponse: LoginResponse = {
      token,
      expiresIn,
    };

    res.json(loginResponse);
  } catch (error) {
    console.error('Login error:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
    };
    res.status(500).json(errorResponse);
  }
});

// Export for testing
export const __setAuthService = (service: AuthService) => {
  authService = service;
};
