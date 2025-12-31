/**
 * Generate Cookie Cats A/B Testing Dataset
 * Based on the original Kaggle dataset structure
 * ~90,000 players with retention data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CookieCatsRow {
  userid: number;
  version: 'gate_30' | 'gate_40';
  sum_gamerounds: number;
  retention_1: boolean;
  retention_7: boolean;
}

// Realistic distribution parameters based on the original dataset
const CONFIG = {
  totalPlayers: 90189,
  gate30Ratio: 0.5,
  // Gate 30 has slightly better retention (the finding from the original study)
  retention1: { gate_30: 0.448, gate_40: 0.442 },
  retention7: { gate_30: 0.190, gate_40: 0.182 },
  // Game rounds follow a power law distribution
  gameRoundsMedian: 16,
  gameRoundsMax: 2961,
};

function randomExponential(median: number): number {
  // Generate exponentially distributed values
  const lambda = Math.log(2) / median;
  return Math.floor(-Math.log(Math.random()) / lambda);
}

function generateRow(userid: number): CookieCatsRow {
  const version = Math.random() < CONFIG.gate30Ratio ? 'gate_30' : 'gate_40';

  // Game rounds with exponential distribution, capped
  let sum_gamerounds = randomExponential(CONFIG.gameRoundsMedian);
  sum_gamerounds = Math.min(sum_gamerounds, CONFIG.gameRoundsMax);

  // Retention depends on version and game rounds
  // Players who play more are more likely to return
  const playFactor = Math.min(sum_gamerounds / 50, 1);
  const baseRetention1 = CONFIG.retention1[version];
  const baseRetention7 = CONFIG.retention7[version];

  // Higher game rounds correlate with higher retention
  const retention_1 = Math.random() < (baseRetention1 * (0.5 + 0.5 * playFactor));
  const retention_7 = retention_1 && Math.random() < (baseRetention7 / baseRetention1);

  return {
    userid,
    version,
    sum_gamerounds,
    retention_1,
    retention_7,
  };
}

function generateDataset(): string {
  const rows: CookieCatsRow[] = [];

  for (let i = 0; i < CONFIG.totalPlayers; i++) {
    rows.push(generateRow(i + 116)); // Start from userid 116 like original
  }

  // Convert to CSV
  const header = 'userid,version,sum_gamerounds,retention_1,retention_7';
  const csvRows = rows.map(row =>
    `${row.userid},${row.version},${row.sum_gamerounds},${row.retention_1},${row.retention_7}`
  );

  return [header, ...csvRows].join('\n');
}

// Calculate and log statistics
function analyzeDataset(csv: string): void {
  const lines = csv.split('\n').slice(1); // Skip header
  const rows = lines.map(line => {
    const [userid, version, sum_gamerounds, retention_1, retention_7] = line.split(',');
    return {
      version,
      sum_gamerounds: parseInt(sum_gamerounds),
      retention_1: retention_1 === 'true',
      retention_7: retention_7 === 'true',
    };
  });

  const gate30 = rows.filter(r => r.version === 'gate_30');
  const gate40 = rows.filter(r => r.version === 'gate_40');

  console.log('\n=== Cookie Cats Dataset Statistics ===');
  console.log(`Total players: ${rows.length}`);
  console.log(`\nGate 30 (${gate30.length} players):`);
  console.log(`  D1 Retention: ${(gate30.filter(r => r.retention_1).length / gate30.length * 100).toFixed(2)}%`);
  console.log(`  D7 Retention: ${(gate30.filter(r => r.retention_7).length / gate30.length * 100).toFixed(2)}%`);
  console.log(`  Avg Game Rounds: ${(gate30.reduce((s, r) => s + r.sum_gamerounds, 0) / gate30.length).toFixed(1)}`);

  console.log(`\nGate 40 (${gate40.length} players):`);
  console.log(`  D1 Retention: ${(gate40.filter(r => r.retention_1).length / gate40.length * 100).toFixed(2)}%`);
  console.log(`  D7 Retention: ${(gate40.filter(r => r.retention_7).length / gate40.length * 100).toFixed(2)}%`);
  console.log(`  Avg Game Rounds: ${(gate40.reduce((s, r) => s + r.sum_gamerounds, 0) / gate40.length).toFixed(1)}`);
}

// Main
const outputDir = path.join(__dirname, '..', 'data', 'csv-tests');
const outputPath = path.join(outputDir, 'cookie_cats.csv');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating Cookie Cats dataset...');
const csv = generateDataset();

fs.writeFileSync(outputPath, csv);
console.log(`Dataset saved to: ${outputPath}`);
console.log(`File size: ${(Buffer.byteLength(csv) / 1024).toFixed(1)} KB`);

analyzeDataset(csv);
