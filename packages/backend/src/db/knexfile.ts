import { config } from '../config';
import type { Knex } from 'knex';
import fs from 'fs';
import path from 'path';

fs.mkdirSync(path.dirname(path.resolve(config.databaseFile)), { recursive: true });

const knexConfig: Knex.Config = {
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
};

export default knexConfig;
module.exports = knexConfig;
