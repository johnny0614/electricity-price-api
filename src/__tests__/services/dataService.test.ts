import { DataService } from '../../services/dataService';
import fs from 'fs';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('DataService', () => {
  let dataService: DataService;
  const mockReadFile = fs.promises.readFile as jest.MockedFunction<typeof fs.promises.readFile>;
  const testCsvPath = '/test/path/data.csv';

  const mockCsvData = `state,price,timestamp
Vic,81.52,2025-06-24 00:00:00
Vic,76.32,2025-06-24 00:30:00
NSW,90.15,2025-06-24 00:00:00
NSW,85.20,2025-06-24 00:30:00
QLD,70.10,2025-06-24 00:00:00
QLD,75.50,2025-06-24 00:30:00`;

  beforeEach(() => {
    process.env.CSV_DATA_PATH = testCsvPath;
    dataService = new DataService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CSV_DATA_PATH;
  });

  describe('loadData', () => {
    it('should successfully load and parse CSV data', async () => {
      mockReadFile.mockResolvedValue(mockCsvData);

      await dataService.loadData();
      const data = dataService.getAllData();

      expect(mockReadFile).toHaveBeenCalledWith(
        testCsvPath,
        'utf8'
      );
      expect(data).toHaveLength(6);
      expect(data[0]).toEqual({
        state: 'Vic',
        price: 81.52,
        timestamp: '2025-06-24 00:00:00'
      });
    });

    it('should throw error when CSV file is not found', async () => {
      const error = new Error('ENOENT: no such file or directory');
      mockReadFile.mockRejectedValue(error);

      await expect(dataService.loadData()).rejects.toThrow('Failed to load CSV data');
    });

    it('should throw error when CSV data is malformed', async () => {
      const malformedCsv = `state,price,timestamp
Vic,invalid_price,2025-06-24 00:00:00`;
      mockReadFile.mockResolvedValue(malformedCsv);

      await expect(dataService.loadData()).rejects.toThrow('Failed to parse CSV data');
    });

    it('should handle empty CSV file', async () => {
      const emptyCsv = 'state,price,timestamp\n';
      mockReadFile.mockResolvedValue(emptyCsv);

      await dataService.loadData();
      const data = dataService.getAllData();

      expect(data).toHaveLength(0);
    });
  });

  describe('getStateData', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(mockCsvData);
      await dataService.loadData();
    });

    it('should return data for existing state', () => {
      const vicData = dataService.getStateData('Vic');
      
      expect(vicData).toHaveLength(2);
      expect(vicData[0].state).toBe('Vic');
      expect(vicData[0].price).toBe(81.52);
    });

    it('should return empty array for non-existent state', () => {
      const data = dataService.getStateData('WA');
      expect(data).toHaveLength(0);
    });

    it('should be case sensitive for state names', () => {
      const data = dataService.getStateData('vic'); // lowercase
      expect(data).toHaveLength(0);
    });

    it('should return empty array for empty state name', () => {
      const data = dataService.getStateData('');
      expect(data).toHaveLength(0);
    });
  });

  describe('getMeanPrice', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(mockCsvData);
      await dataService.loadData();
    });

    it('should calculate correct mean price for existing state', () => {
      const meanPrice = dataService.getMeanPrice('Vic');
      const expectedMean = (81.52 + 76.32) / 2; // 78.92
      
      expect(meanPrice).toBeCloseTo(expectedMean, 2);
    });

    it('should calculate correct mean price for state with different prices', () => {
      const meanPrice = dataService.getMeanPrice('NSW');
      const expectedMean = (90.15 + 85.20) / 2; // 87.675
      
      expect(meanPrice).toBeCloseTo(expectedMean, 2);
    });

    it('should return null for non-existent state', () => {
      const meanPrice = dataService.getMeanPrice('WA');
      expect(meanPrice).toBeNull();
    });

    it('should return null for empty state name', () => {
      const meanPrice = dataService.getMeanPrice('');
      expect(meanPrice).toBeNull();
    });

    it('should handle single data point correctly', async () => {
      const singleDataCsv = `state,price,timestamp
SA,100.50,2025-06-24 00:00:00`;
      mockReadFile.mockResolvedValue(singleDataCsv);
      
      process.env.CSV_DATA_PATH = '/test/single-data.csv';
      const newDataService = new DataService();
      await newDataService.loadData();
      
      const meanPrice = newDataService.getMeanPrice('SA');
      expect(meanPrice).toBe(100.50);
    });
  });

  describe('getAvailableStates', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(mockCsvData);
      await dataService.loadData();
    });

    it('should return unique list of available states', () => {
      const states = dataService.getAvailableStates();
      
      expect(states).toHaveLength(3);
      expect(states).toContain('Vic');
      expect(states).toContain('NSW');
      expect(states).toContain('QLD');
    });

    it('should return empty array when no data is loaded', () => {
      process.env.CSV_DATA_PATH = '/test/empty-data.csv';
      const emptyDataService = new DataService();
      const states = emptyDataService.getAvailableStates();
      
      expect(states).toHaveLength(0);
    });
  });

  describe('constructor', () => {
    it('should throw error when CSV_DATA_PATH is not set and no csvFilePath provided', () => {
      delete process.env.CSV_DATA_PATH;
      expect(() => new DataService()).toThrow('CSV_DATA_PATH environment variable is required or provide csvFilePath in constructor');
    });

    it('should use provided csvFilePath over environment variable', () => {
      process.env.CSV_DATA_PATH = '/env/path.csv';
      const customPath = '/custom/path.csv';
      const service = new DataService(customPath);
      expect(service['csvFilePath']).toBe(customPath);
    });

    it('should use environment variable when no csvFilePath provided', () => {
      const envPath = '/env/test.csv';
      process.env.CSV_DATA_PATH = envPath;
      const service = new DataService();
      expect(service['csvFilePath']).toBe(envPath);
    });
  });

  describe('data validation', () => {
    it('should validate price is a number', async () => {
      const invalidCsv = `state,price,timestamp
Vic,not-a-number,2025-06-24 00:00:00`;
      mockReadFile.mockResolvedValue(invalidCsv);

      await expect(dataService.loadData()).rejects.toThrow('Failed to parse CSV data');
    });

    it('should handle missing required fields', async () => {
      const incompleteCsv = `state,price,timestamp
Vic,,2025-06-24 00:00:00`;
      mockReadFile.mockResolvedValue(incompleteCsv);

      await expect(dataService.loadData()).rejects.toThrow('Failed to parse CSV data');
    });

    it('should handle negative prices', async () => {
      const negativePriceCsv = `state,price,timestamp
Vic,-10.50,2025-06-24 00:00:00`;
      mockReadFile.mockResolvedValue(negativePriceCsv);

      await dataService.loadData();
      const meanPrice = dataService.getMeanPrice('Vic');
      expect(meanPrice).toBe(-10.50);
    });
  });
});