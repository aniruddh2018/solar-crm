import knex from 'knex';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

fs.mkdirSync(path.dirname(path.resolve(config.databaseFile)), { recursive: true });

const db = knex({
  client: 'better-sqlite3',
  connection: { filename: config.databaseFile },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    extension: 'ts',
  },
});

export default db;
