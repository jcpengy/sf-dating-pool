import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const personPath = resolve(process.argv[2] ?? 'data/raw/psam_p06.csv');
const housingPath = resolve(process.argv[3] ?? 'data/raw/psam_h06.csv');
const outputPath = resolve(process.argv[4] ?? 'src/data/pums-cube.json');
const sfPumas = new Set(['07507', '07508', '07509', '07510', '07511', '07512', '07513', '07514']);
const techIndustries = new Set(['3365', '3370', '3390', '6490', '6695', '6781', '7380']);

function indexes(header) {
  return new Map(header.split(',').map((name, index) => [name.trim(), index]));
}

async function householdChildrenBySerial() {
  const map = new Map();
  const lines = createInterface({ input: createReadStream(housingPath), crlfDelay: Infinity });
  let columns;

  for await (const line of lines) {
    if (!columns) {
      columns = indexes(line);
      continue;
    }
    const row = line.split(',');
    if (!sfPumas.has(row[columns.get('PUMA')])) continue;
    const value = row[columns.get('HUPARC')];
    map.set(row[columns.get('SERIALNO')], ['1', '2', '3'].includes(value) ? 1 : value === '4' ? 0 : 2);
  }
  return map;
}

function incomeBucket(value) {
  if (value >= 250_000) return 4;
  if (value >= 150_000) return 3;
  if (value >= 100_000) return 2;
  if (value >= 50_000) return 1;
  return 0;
}

function worksInTech(occupation, industry) {
  const occupationCode = Number(occupation);
  const techOccupation = occupationCode === 110 || (occupationCode >= 1005 && occupationCode <= 1240);
  return techOccupation || techIndustries.has(industry) ? 1 : 0;
}

const children = await householdChildrenBySerial();
const cube = new Map();
const lines = createInterface({ input: createReadStream(personPath), crlfDelay: Infinity });
let columns;
let sampleCount = 0;

for await (const line of lines) {
  if (!columns) {
    columns = indexes(line);
    continue;
  }
  const row = line.split(',');
  if (!sfPumas.has(row[columns.get('PUMA')])) continue;
  const age = Number(row[columns.get('AGEP')]);
  if (age < 21) continue;

  const income = Number(row[columns.get('PINCP')] || 0);
  const child = children.get(row[columns.get('SERIALNO')]) ?? 2;
  const married = row[columns.get('MAR')] === '1' ? 1 : 0;
  const tech = worksInTech(row[columns.get('OCCP')], row[columns.get('INDP')]);
  const ageBucket = Math.min(age, 80);
  const incomeBand = incomeBucket(income);
  const key = `${ageBucket}|${incomeBand}|${child}|${married}|${tech}`;
  const cell = cube.get(key) ?? { a: ageBucket, i: incomeBand, c: child, m: married, t: tech, w: 0, r: Array(80).fill(0) };

  cell.w += Number(row[columns.get('PWGTP')]);
  for (let index = 0; index < 80; index += 1) {
    cell.r[index] += Number(row[columns.get(`PWGTP${index + 1}`)]);
  }
  cube.set(key, cell);
  sampleCount += 1;
}

const cells = [...cube.values()].sort((left, right) =>
  left.a - right.a || left.i - right.i || left.c - right.c || left.m - right.m || left.t - right.t,
);
const totalWeight = cells.reduce((sum, cell) => sum + cell.w, 0);
const output = {
  metadata: {
    year: 2024,
    geography: 'San Francisco County, California',
    minimumAge: 21,
    totalWeight,
    sampleCount,
    sourceUrl: 'https://www.census.gov/programs-surveys/acs/microdata.html',
    pumas: [...sfPumas],
    techDefinition: {
      occupations: 'OCCP 0110 or 1005–1240',
      industries: [...techIndustries],
    },
  },
  cells,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output)}\n`);
console.log(`Wrote ${cells.length} aggregate cells from ${sampleCount} sample records to ${outputPath}`);
