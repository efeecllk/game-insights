/**
 * Cookie Cats Dataset Integration Test
 * Tests schema detection, game type detection, and data processing
 */

import { describe, test, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// Test data path
const DATASET_PATH = path.join(__dirname, '../../data/csv-tests/cookie_cats.csv');

interface CookieCatsRow {
  userid: string;
  version: string;
  sum_gamerounds: string;
  retention_1: string;
  retention_7: string;
}

describe('Cookie Cats Dataset Integration', () => {
  let data: CookieCatsRow[] = [];
  let parseTime: number = 0;

  beforeAll(async () => {
    const fileContent = fs.readFileSync(DATASET_PATH, 'utf-8');
    const start = Date.now();

    const result = Papa.parse<CookieCatsRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    parseTime = Date.now() - start;
    data = result.data;
  });

  describe('Data Loading', () => {
    test('loads ~90,000 rows', () => {
      expect(data.length).toBeGreaterThan(89000);
      expect(data.length).toBeLessThan(91000);
    });

    test('parses in under 2 seconds', () => {
      expect(parseTime).toBeLessThan(2000);
      console.log(`Parse time: ${parseTime}ms for ${data.length} rows`);
    });

    test('has correct column structure', () => {
      const firstRow = data[0];
      expect(firstRow).toHaveProperty('userid');
      expect(firstRow).toHaveProperty('version');
      expect(firstRow).toHaveProperty('sum_gamerounds');
      expect(firstRow).toHaveProperty('retention_1');
      expect(firstRow).toHaveProperty('retention_7');
    });
  });

  describe('Schema Analysis', () => {
    test('userid is numeric', () => {
      const sample = data.slice(0, 100);
      const allNumeric = sample.every(row => !isNaN(parseInt(row.userid)));
      expect(allNumeric).toBe(true);
    });

    test('version has exactly two values', () => {
      const versions = new Set(data.map(row => row.version));
      expect(versions.size).toBe(2);
      expect(versions.has('gate_30')).toBe(true);
      expect(versions.has('gate_40')).toBe(true);
    });

    test('retention columns are boolean strings', () => {
      const sample = data.slice(0, 100);
      const validBooleans = sample.every(row =>
        ['true', 'false'].includes(row.retention_1) &&
        ['true', 'false'].includes(row.retention_7)
      );
      expect(validBooleans).toBe(true);
    });

    test('sum_gamerounds is non-negative integer', () => {
      const sample = data.slice(0, 1000);
      const allValid = sample.every(row => {
        const num = parseInt(row.sum_gamerounds);
        return !isNaN(num) && num >= 0;
      });
      expect(allValid).toBe(true);
    });
  });

  describe('A/B Test Analysis', () => {
    test('groups are roughly equal size (45-55% each)', () => {
      const gate30Count = data.filter(row => row.version === 'gate_30').length;
      const gate40Count = data.filter(row => row.version === 'gate_40').length;

      const gate30Ratio = gate30Count / data.length;
      expect(gate30Ratio).toBeGreaterThan(0.45);
      expect(gate30Ratio).toBeLessThan(0.55);

      console.log(`Gate 30: ${gate30Count} (${(gate30Ratio * 100).toFixed(1)}%)`);
      console.log(`Gate 40: ${gate40Count} (${((1 - gate30Ratio) * 100).toFixed(1)}%)`);
    });

    test('calculates D1 retention by variant', () => {
      const gate30 = data.filter(row => row.version === 'gate_30');
      const gate40 = data.filter(row => row.version === 'gate_40');

      const gate30D1 = gate30.filter(row => row.retention_1 === 'true').length / gate30.length;
      const gate40D1 = gate40.filter(row => row.retention_1 === 'true').length / gate40.length;

      // Both should be between 20-50%
      expect(gate30D1).toBeGreaterThan(0.2);
      expect(gate30D1).toBeLessThan(0.5);
      expect(gate40D1).toBeGreaterThan(0.2);
      expect(gate40D1).toBeLessThan(0.5);

      console.log(`Gate 30 D1 Retention: ${(gate30D1 * 100).toFixed(2)}%`);
      console.log(`Gate 40 D1 Retention: ${(gate40D1 * 100).toFixed(2)}%`);
    });

    test('calculates D7 retention by variant', () => {
      const gate30 = data.filter(row => row.version === 'gate_30');
      const gate40 = data.filter(row => row.version === 'gate_40');

      const gate30D7 = gate30.filter(row => row.retention_7 === 'true').length / gate30.length;
      const gate40D7 = gate40.filter(row => row.retention_7 === 'true').length / gate40.length;

      // Both should be between 5-25%
      expect(gate30D7).toBeGreaterThan(0.05);
      expect(gate30D7).toBeLessThan(0.25);
      expect(gate40D7).toBeGreaterThan(0.05);
      expect(gate40D7).toBeLessThan(0.25);

      console.log(`Gate 30 D7 Retention: ${(gate30D7 * 100).toFixed(2)}%`);
      console.log(`Gate 40 D7 Retention: ${(gate40D7 * 100).toFixed(2)}%`);
    });
  });

  describe('Game Rounds Analysis', () => {
    test('calculates average game rounds', () => {
      const total = data.reduce((sum, row) => sum + parseInt(row.sum_gamerounds), 0);
      const avg = total / data.length;

      expect(avg).toBeGreaterThan(10);
      expect(avg).toBeLessThan(100);

      console.log(`Average game rounds: ${avg.toFixed(1)}`);
    });

    test('finds max game rounds', () => {
      const max = Math.max(...data.map(row => parseInt(row.sum_gamerounds)));

      // Max should be at least 100 (reasonable upper bound for engagement)
      expect(max).toBeGreaterThan(100);
      console.log(`Max game rounds: ${max}`);
    });

    test('calculates game rounds distribution', () => {
      const rounds = data.map(row => parseInt(row.sum_gamerounds));
      const buckets = {
        '0': 0,
        '1-10': 0,
        '11-50': 0,
        '51-100': 0,
        '100+': 0,
      };

      rounds.forEach(r => {
        if (r === 0) buckets['0']++;
        else if (r <= 10) buckets['1-10']++;
        else if (r <= 50) buckets['11-50']++;
        else if (r <= 100) buckets['51-100']++;
        else buckets['100+']++;
      });

      console.log('Game rounds distribution:');
      Object.entries(buckets).forEach(([range, count]) => {
        console.log(`  ${range}: ${count} (${(count / data.length * 100).toFixed(1)}%)`);
      });

      // Most players should play between 1-50 rounds
      expect(buckets['1-10'] + buckets['11-50']).toBeGreaterThan(data.length * 0.5);
    });
  });

  describe('Retention Correlation', () => {
    test('D7 retention is subset of D1 retention', () => {
      const d7WithoutD1 = data.filter(
        row => row.retention_7 === 'true' && row.retention_1 === 'false'
      );

      // D7 retained players should mostly have D1 retention too
      // (Some edge cases may exist in synthetic data)
      expect(d7WithoutD1.length).toBeLessThan(data.length * 0.01);
    });

    test('more game rounds correlates with higher retention', () => {
      const lowRounds = data.filter(row => parseInt(row.sum_gamerounds) <= 5);
      const highRounds = data.filter(row => parseInt(row.sum_gamerounds) >= 50);

      const lowRetention = lowRounds.filter(row => row.retention_1 === 'true').length / lowRounds.length;
      const highRetention = highRounds.filter(row => row.retention_1 === 'true').length / highRounds.length;

      console.log(`Low rounds (<=5) D1 retention: ${(lowRetention * 100).toFixed(2)}%`);
      console.log(`High rounds (>=50) D1 retention: ${(highRetention * 100).toFixed(2)}%`);

      // High round players should have better retention
      expect(highRetention).toBeGreaterThan(lowRetention);
    });
  });
});
