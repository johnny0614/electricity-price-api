# Electricity Price API Challenge

In this challenge, you will build a web service that provides electricity
price information based on historical data.

We have uploaded a week's worth of half-hourly electricity prices for each state to a
CSV. Your task is to create a web API that allows clients to retrieve the
mean electricity price for a specific state.

You may use either Python or JavaScript/TypeScript to complete this challenge.

## The Challenge

Your web API should:

* Access the provided data
* Run a web server with at least one endpoint that accepts a ``state`` argument and
calculates the mean price for that state
* Your submission should include a ``README.md`` with instructions on how to set up and run
the application

## Resources

* You may use any Python/JavaScript/TypeScript version that is not end of life
* You may use any web framework that you like
* You may use any additional packages/frameworks that you think are appropriate
* You are provided the data in the ``data/`` directory, which contains a CSV with three
columns:

  * ``state``: The state for which the model is run
  * ``price``: The price that is modelled
  * ``timestamp``: The start of the time period for which the price is modelled

## What We Are Assessing

This exercise is intended to assess your ability to:

* Write clean and maintainable code
* Build simple and well-structured web applications
* Handle data ingestion and processing
* Follow best practices in testing, structure, and deployment

## Local Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd electricity-price-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```bash
   # Required Environment Variables
   JWT_SECRET=your-super-secret-jwt-key-here
   API_USERNAME=admin
   API_PASSWORD=your-secure-password
   CSV_DATA_PATH=data/coding_challenge_prices.csv
   
   # Optional
   PORT=8080
   NODE_ENV=development
   ```

### Building and Running

#### Development Mode (with hot reload)
```bash
# Start in development mode with auto-restart
npm run dev

# Or use watch mode for file changes
npm run watch
```

#### Production Build and Run
```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

#### Available Scripts

- `npm run dev` - Start development server with ts-node
- `npm run watch` - Development server with auto-restart on file changes
- `npm run build` - Compile TypeScript to JavaScript in `dist/` folder
- `npm start` - Run the compiled production server
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Fix auto-fixable linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing the API

Once the server is running (default: http://localhost:8080), you can test it:

1. **Health Check:**
   ```bash
   curl http://localhost:8080/
   ```

2. **Login to get JWT token:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "your-secure-password"}'
   ```

3. **Get price data (use token from step 2):**
   ```bash
   curl -X GET "http://localhost:8080/api/price?state=NSW" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
   ```

### Available States

The API supports the following Australian states:
- `NSW` - New South Wales
- `Vic` - Victoria
- `QLD` - Queensland
- `SA` - South Australia
- `TAS` - Tasmania

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (reruns on file changes)
npm run test:watch
```

### Code Quality

```bash
# Check code style
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## Submission

You may submit your application in two ways:

1. A link to a public Git repository (e.g. GitHub, GitLab, etc.)
2. An email that includes your repository as a zipfile  
