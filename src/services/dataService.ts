import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PriceRecord } from '../types';

export class DataService {
  private data: PriceRecord[] = [];
  private states: string[] = [];
  private csvFilePath: string;

  constructor(csvFilePath?: string) {
    const envPath = process.env.CSV_DATA_PATH;

    if (!csvFilePath && !envPath) {
      throw new Error(
        'CSV_DATA_PATH environment variable is required or provide csvFilePath in constructor'
      );
    }

    this.csvFilePath = csvFilePath || envPath!;
  }

  async loadData(): Promise<void> {
    try {
      const csvData = await fs.promises.readFile(this.csvFilePath, 'utf8');
      const states = new Set<string>();

      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        cast: true,
      });

      this.data = records.map((record: any) => {
        const price = parseFloat(record.price);

        if (isNaN(price) || !record.state || !record.timestamp) {
          throw new Error(`Invalid data format: ${JSON.stringify(record)}`);
        }

        states.add(record.state);

        return {
          state: record.state,
          price: price,
          timestamp: record.timestamp,
        };
      });

      this.states = Array.from(states);
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          throw new Error('Failed to load CSV data: File not found');
        }
        if (error.message.includes('Invalid data format')) {
          throw new Error('Failed to parse CSV data: ' + error.message);
        }
        throw new Error('Failed to load CSV data: ' + error.message);
      }
      throw new Error('Failed to load CSV data: Unknown error');
    }
  }

  getAllData(): PriceRecord[] {
    return [...this.data];
  }

  getStateData(state: string): PriceRecord[] {
    if (!state) {
      return [];
    }

    return this.data.filter((record) => record.state === state);
  }

  getMeanPrice(state: string): number | null {
    const stateData = this.getStateData(state);

    if (stateData.length === 0) {
      return null;
    }

    const totalPrice = stateData.reduce((sum, record) => sum + record.price, 0);
    return totalPrice / stateData.length;
  }

  getAvailableStates(): string[] {
    return [...this.states];
  }
}
