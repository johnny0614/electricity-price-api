# Implementation Plan for Electricity Price API with Basic Auth

## Overview
Build a TypeScript/Express API that reads CSV data, provides mean electricity prices by state via query parameter, and includes basic username/password authentication from environment variables, following TDD methodology.

## Phase 1: Setup & Dependencies
1. **Add testing framework, CSV parsing, and auth dependencies**
   - Install Jest, @types/jest, supertest for testing
   - Install csv-parser or csv-parse for CSV reading
   - Install bcrypt, jsonwebtoken, dotenv for auth
   - Install @types/bcrypt, @types/jsonwebtoken
   - Configure Jest in package.json

## Phase 2: TDD - Authentication Layer (Red → Green → Refactor)
2. **Write failing tests for auth service**
   - Test user login with env credentials
   - Test password verification
   - Test JWT token generation/validation
   - Test invalid credentials handling

3. **Implement authentication service**
   - Create `src/services/authService.ts`
   - Load username/password from environment variables
   - Implement password verification
   - Implement JWT token generation/validation
   - Make tests pass

4. **Write failing tests for auth middleware**
   - Test JWT token extraction from headers
   - Test token validation middleware
   - Test protected route access
   - Test unauthorized access handling

5. **Implement auth middleware**
   - Create `src/middleware/auth.ts`
   - Implement JWT validation middleware
   - Make tests pass

## Phase 3: TDD - Data Layer (Red → Green → Refactor)
6. **Write failing tests for CSV data service**
   - Test reading CSV file
   - Test parsing CSV data structure
   - Test filtering by state
   - Test calculating mean price

7. **Implement CSV data service**
   - Create `src/services/dataService.ts`
   - Implement CSV file reading
   - Implement state filtering logic
   - Implement mean calculation
   - Make tests pass

## Phase 4: TDD - API Layer with Auth
8. **Write failing tests for login endpoint**
   - Test POST /api/auth/login with valid credentials
   - Test POST /api/auth/login with invalid credentials
   - Test input validation for login
   - Test JWT token response format

9. **Implement login endpoint**
   - Create `src/routes/authRoutes.ts`
   - Implement login endpoint
   - Add input validation
   - Make tests pass

10. **Write failing tests for protected price endpoints**
    - Test GET /api/price?state=Vic with valid token
    - Test GET /api/price without state query parameter (400)
    - Test GET /api/price?state=invalid with non-existent state
    - Test GET /api/price without token (401)
    - Test GET /api/price with invalid token (401)

11. **Implement protected price endpoints**
    - Create `src/routes/priceRoutes.ts`
    - Apply auth middleware to price endpoints
    - Implement GET /api/price endpoint with state query parameter
    - Add query parameter validation and error handling
    - Make tests pass

## Phase 5: Environment & Configuration
12. **Create environment configuration**
    - Create `.env.example` with required variables
    - Add environment variable loading in server
    - Configure JWT secret, username, password from env

## Phase 6: Integration & Error Handling
13. **Write integration tests**
    - Test complete auth flow (login → access data)
    - Test edge cases (expired tokens, malformed requests)
    - Test CSV data processing with various states

14. **Implement robust error handling**
    - Authentication errors (invalid credentials)
    - Authorization errors (missing/invalid tokens)
    - Missing or invalid query parameters
    - File not found errors
    - Invalid CSV format errors
    - Missing environment variables
    - Server errors

## Phase 7: Documentation & Polish
15. **Update documentation**
    - Update README.md with setup/run instructions
    - Add environment variable configuration
    - Add API endpoint documentation with auth examples
    - Include example requests/responses with JWT tokens

## Expected Structure
```
src/
├── services/
│   ├── dataService.ts       # CSV reading & processing
│   └── authService.ts       # JWT handling & credential verification
├── routes/
│   ├── priceRoutes.ts       # Protected API endpoints
│   └── authRoutes.ts        # Login endpoint
├── middleware/
│   └── auth.ts              # JWT validation middleware
├── types/
│   └── index.ts            # TypeScript interfaces
├── __tests__/
│   ├── services/
│   ├── routes/
│   └── middleware/
└── server.ts               # Main server file
```

## Environment Variables
- `API_USERNAME` - Admin username
- `API_PASSWORD` - Admin password
- `JWT_SECRET` - JWT signing secret

## API Endpoints
- `POST /api/auth/login` - Login with username/password, get JWT token
- `GET /api/price?state=<state>` - Get mean price for state (requires JWT)

This follows TDD by writing tests first, then implementing just enough code to make tests pass, then refactoring for clean code.