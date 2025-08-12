import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/authRoutes';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    process.env.API_USERNAME = 'testuser';
    process.env.API_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    delete process.env.API_USERNAME;
    delete process.env.API_PASSWORD;
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/auth/login', () => {
    it('should return JWT token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.expiresIn).toBe('number');
    });

    it('should return 401 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'testpass'
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid credentials'
      });
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpass'
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid credentials'
      });
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testpass'
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required'
      });
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required'
      });
    });

    it('should return 400 for empty username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: 'testpass'
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required'
      });
    });

    it('should return 400 for empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: ''
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Username and password are required'
      });
    });

    it('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return valid JWT token that can be decoded', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      
      // Token should be a JWT format (header.payload.signature)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Should be able to decode the payload (without verification for this test)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(payload).toHaveProperty('username', 'testuser');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    it('should set token expiration to 24 hours from now', async () => {
      const beforeLogin = Math.floor(Date.now() / 1000);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })
        .expect(200);

      const token = response.body.token;
      const tokenParts = token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      const expectedExp = beforeLogin + (24 * 60 * 60); // 24 hours
      expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 5); // Allow 5 second variance
      expect(payload.exp).toBeLessThanOrEqual(expectedExp + 5);
      
      expect(response.body.expiresIn).toBe(24 * 60 * 60); // 24 hours in seconds
    });
  });
});