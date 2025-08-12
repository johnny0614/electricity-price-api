import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export class AuthService {
  private readonly users: Map<string, string>;
  private readonly jwtSecret: string;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    this.jwtSecret = jwtSecret;
    this.users = new Map();

    // Load users from environment variables
    this.loadUsersFromEnv();

    if (this.users.size === 0) {
      throw new Error(
        'No users found. Set API_USERS environment variable with format "username1:password1,username2:password2" or use legacy API_USERNAME and API_PASSWORD'
      );
    }
  }

  private loadUsersFromEnv(): void {
    // Try new format first: API_USERS="user1:pass1,user2:pass2"
    const apiUsers = process.env.API_USERS;
    if (apiUsers) {
      const userPairs = apiUsers.split(',');
      for (const pair of userPairs) {
        const [username, password] = pair.trim().split(':');
        if (username && password) {
          this.users.set(username, password);
        }
      }
      return;
    }

    // Fallback to legacy format: API_USERNAME and API_PASSWORD
    const legacyUsername = process.env.API_USERNAME;
    const legacyPassword = process.env.API_PASSWORD;
    if (legacyUsername && legacyPassword) {
      this.users.set(legacyUsername, legacyPassword);
    }
  }

  async validateCredentials(
    username: string,
    password: string
  ): Promise<boolean> {
    if (!username || !password) {
      return false;
    }

    const storedPassword = this.users.get(username);
    return storedPassword === password;
  }

  generateToken(username: string): string {
    const payload = {
      username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  validateToken(token: string): JWTPayload | null {
    if (!token) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
