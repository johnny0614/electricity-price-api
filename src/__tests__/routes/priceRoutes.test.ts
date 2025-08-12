import request from 'supertest';
import express from 'express';
import { priceRouter } from '../../routes/priceRoutes';
import { AuthService } from '../../services/authService';

describe('Price Routes', () => {
  let app: express.Application;
  let authService: AuthService;
  let validToken: string;

  beforeEach(() => {
    process.env.API_USERNAME = 'testuser';
    process.env.API_PASSWORD = 'testpass';
    process.env.JWT_SECRET = 'testsecret';
    process.env.CSV_DATA_PATH = 'data/coding_challenge_prices.csv';

    authService = new AuthService();
    validToken = authService.generateToken('testuser');

    app = express();
    app.use(express.json());
    app.use('/api/price', priceRouter);
  });

  afterEach(() => {
    delete process.env.API_USERNAME;
    delete process.env.API_PASSWORD;
    delete process.env.JWT_SECRET;
    delete process.env.CSV_DATA_PATH;
  });

  describe('GET /api/price', () => {
    it('should return mean price for valid state with valid token', async () => {
      const response = await request(app)
        .get('/api/price?state=Vic')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('state', 'Vic');
      expect(response.body).toHaveProperty('meanPrice');
      expect(response.body).toHaveProperty('recordCount');
      expect(typeof response.body.meanPrice).toBe('number');
      expect(typeof response.body.recordCount).toBe('number');
      expect(response.body.recordCount).toBeGreaterThan(0);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/price?state=Vic')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Access token required'
      });
    });

    it('should return 401 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/api/price?state=Vic')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid token'
      });
    });

    it('should return 401 when malformed Authorization header is provided', async () => {
      const response = await request(app)
        .get('/api/price?state=Vic')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Access token required'
      });
    });

    it('should return 401 when Authorization header has no token', async () => {
      const response = await request(app)
        .get('/api/price?state=Vic')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Access token required'
      });
    });

    it('should return 400 when state query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/price')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'State query parameter is required'
      });
    });

    it('should return 400 when state query parameter is empty', async () => {
      const response = await request(app)
        .get('/api/price?state=')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'State query parameter is required'
      });
    });

    it('should return 404 when state does not exist in data', async () => {
      const response = await request(app)
        .get('/api/price?state=InvalidState')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'No data found for state: InvalidState'
      });
    });

    it('should return correct data structure for multiple valid states', async () => {
      const states = ['NSW', 'Vic', 'QLD'];
      
      for (const state of states) {
        const response = await request(app)
          .get(`/api/price?state=${state}`)
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('state', state);
        expect(response.body).toHaveProperty('meanPrice');
        expect(response.body).toHaveProperty('recordCount');
        expect(typeof response.body.meanPrice).toBe('number');
        expect(typeof response.body.recordCount).toBe('number');
        expect(response.body.meanPrice).toBeGreaterThan(0);
        expect(response.body.recordCount).toBeGreaterThan(0);
      }
    });

    it('should handle case-sensitive state names correctly', async () => {
      const response = await request(app)
        .get('/api/price?state=vic')  // lowercase
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'No data found for state: vic'
      });
    });

    it('should return consistent results for the same state', async () => {
      const response1 = await request(app)
        .get('/api/price?state=NSW')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/price?state=NSW')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should return 401 for expired token', async () => {
      // Create an expired token by mocking the current time
      const expiredPayload = {
        username: 'testuser',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
      };
      
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(expiredPayload, 'testsecret');

      const response = await request(app)
        .get('/api/price?state=NSW')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Invalid token'
      });
    });
  });
});