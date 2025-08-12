import { Response, NextFunction } from 'express';
import { authMiddleware, __setAuthService } from '../../middleware/auth';
import { AuthService } from '../../services/authService';
import { AuthenticatedRequest } from '../../types';

jest.mock('../../services/authService');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    // Set up environment variables for AuthService
    process.env.API_USERNAME = 'testuser';
    process.env.API_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';

    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();

    // Mock AuthService methods
    mockAuthService = {
      validateToken: jest.fn(),
      validateCredentials: jest.fn(),
      generateToken: jest.fn(),
    } as any;
    
    __setAuthService(mockAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.API_USERNAME;
    delete process.env.API_PASSWORD;
    delete process.env.JWT_SECRET;
  });

  describe('Token extraction', () => {
    it('should call next() when valid token is provided in Authorization header', () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken123',
      };
      mockAuthService.validateToken.mockReturnValue({ username: 'testuser', iat: 123456, exp: 789012 });

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('validtoken123');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({ username: 'testuser', iat: 123456, exp: 789012 });
    });

    it('should return 401 when no Authorization header is provided', () => {
      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is malformed (no Bearer)', () => {
      mockRequest.headers = {
        authorization: 'invalidtoken123',
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has Bearer but no token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Token validation', () => {
    it('should return 401 when token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };
      mockAuthService.validateToken.mockReturnValue(null);

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalidtoken');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle token validation errors gracefully', () => {
      mockRequest.headers = {
        authorization: 'Bearer errortoken',
      };
      mockAuthService.validateToken.mockImplementation(() => {
        throw new Error('Token validation error');
      });

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('User context', () => {
    it('should set user context in request when token is valid', () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken',
      };
      const mockUser = { username: 'testuser', iat: 123456, exp: 789012 };
      mockAuthService.validateToken.mockReturnValue(mockUser);

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should not set user context when token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };
      mockAuthService.validateToken.mockReturnValue(null);

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});