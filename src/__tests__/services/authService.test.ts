import { AuthService } from '../../services/authService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    process.env.API_USERS = 'testuser:testpass,admin:adminpass';
    process.env.JWT_SECRET = 'testsecret123';
    authService = new AuthService();
  });

  afterEach(() => {
    delete process.env.API_USERS;
    delete process.env.API_USERNAME;
    delete process.env.API_PASSWORD;
    delete process.env.JWT_SECRET;
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials (first user)', async () => {
      const result = await authService.validateCredentials('testuser', 'testpass');
      expect(result).toBe(true);
    });

    it('should return true for valid credentials (second user)', async () => {
      const result = await authService.validateCredentials('admin', 'adminpass');
      expect(result).toBe(true);
    });

    it('should return false for invalid username', async () => {
      const result = await authService.validateCredentials('wronguser', 'testpass');
      expect(result).toBe(false);
    });

    it('should return false for invalid password', async () => {
      const result = await authService.validateCredentials('testuser', 'wrongpass');
      expect(result).toBe(false);
    });

    it('should return false for empty credentials', async () => {
      const result1 = await authService.validateCredentials('', 'testpass');
      const result2 = await authService.validateCredentials('testuser', '');
      const result3 = await authService.validateCredentials('', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token for valid user', () => {
      const token = authService.generateToken('testuser');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for the same user (due to timestamp)', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000000)
        .mockReturnValueOnce(2000000);
      
      const token1 = authService.generateToken('testuser');
      const token2 = authService.generateToken('testuser');
      
      expect(token1).not.toBe(token2);
      
      jest.restoreAllMocks();
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', () => {
      const token = authService.generateToken('testuser');
      const payload = authService.validateToken(token);
      
      expect(payload).toBeDefined();
      expect(payload?.username).toBe('testuser');
    });

    it('should return null for invalid token', () => {
      const payload = authService.validateToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should return null for empty token', () => {
      const payload = authService.validateToken('');
      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      const payload = authService.validateToken('not-a-jwt-token');
      expect(payload).toBeNull();
    });
  });

  describe('environment variable handling', () => {
    it('should work with legacy API_USERNAME and API_PASSWORD format', () => {
      delete process.env.API_USERS;
      process.env.API_USERNAME = 'legacyuser';
      process.env.API_PASSWORD = 'legacypass';
      process.env.JWT_SECRET = 'testsecret';
      
      const legacyAuthService = new AuthService();
      expect(legacyAuthService.validateCredentials('legacyuser', 'legacypass')).resolves.toBe(true);
    });

    it('should prioritize API_USERS over legacy format', () => {
      process.env.API_USERS = 'newuser:newpass';
      process.env.API_USERNAME = 'legacyuser';
      process.env.API_PASSWORD = 'legacypass';
      process.env.JWT_SECRET = 'testsecret';
      
      const authService = new AuthService();
      expect(authService.validateCredentials('newuser', 'newpass')).resolves.toBe(true);
      expect(authService.validateCredentials('legacyuser', 'legacypass')).resolves.toBe(false);
    });

    it('should throw error if no users are configured', () => {
      delete process.env.API_USERS;
      delete process.env.API_USERNAME;
      delete process.env.API_PASSWORD;
      process.env.JWT_SECRET = 'testsecret';
      
      expect(() => new AuthService()).toThrow('No users found. Set API_USERS environment variable with format "username1:password1,username2:password2" or use legacy API_USERNAME and API_PASSWORD');
    });

    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      expect(() => new AuthService()).toThrow('JWT_SECRET environment variable is required');
    });

    it('should handle malformed API_USERS format gracefully', () => {
      process.env.API_USERS = 'invalidformat,user2:,user3:pass3';
      process.env.JWT_SECRET = 'testsecret';
      
      const authService = new AuthService();
      expect(authService.validateCredentials('user3', 'pass3')).resolves.toBe(true);
      expect(authService.validateCredentials('invalidformat', '')).resolves.toBe(false);
    });
  });
});