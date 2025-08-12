import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { DataService } from '../services/dataService';
import { AuthenticatedRequest, PriceResponse, ErrorResponse } from '../types';

export const priceRouter = Router();

let dataService: DataService;

const getDataService = () => {
  if (!dataService) {
    dataService = new DataService();
  }
  return dataService;
};

// Apply auth middleware to all price routes
priceRouter.use(authMiddleware);

priceRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { state } = req.query;

    // Validate state parameter
    if (!state || typeof state !== 'string' || state.trim() === '') {
      const errorResponse: ErrorResponse = {
        error: 'State query parameter is required',
      };
      return res.status(400).json(errorResponse);
    }

    // Initialize data service and load data if needed
    const service = getDataService();

    // Load data if not already loaded
    try {
      await service.loadData();
    } catch (error) {
      console.error('Error loading data:', error);
      const errorResponse: ErrorResponse = {
        error: 'Failed to load price data',
      };
      return res.status(500).json(errorResponse);
    }

    // Get mean price for the state
    const meanPrice = service.getMeanPrice(state);

    if (meanPrice === null) {
      const errorResponse: ErrorResponse = {
        error: `No data found for state: ${state}`,
      };
      return res.status(404).json(errorResponse);
    }

    // Get record count for the state
    const stateData = service.getStateData(state);
    const recordCount = stateData.length;

    const priceResponse: PriceResponse = {
      state,
      meanPrice,
      recordCount,
    };

    res.json(priceResponse);
  } catch (error) {
    console.error('Price endpoint error:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
    };
    res.status(500).json(errorResponse);
  }
});

// Export for testing
export const __setDataService = (service: DataService) => {
  dataService = service;
};
