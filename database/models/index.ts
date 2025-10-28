'use strict';
import fs from 'fs';
import path from 'path';
import * as seq from 'sequelize';
import process from 'process';
import dbConfig from '../../configuration/db.config';
import { initUser } from './user';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// ✅ Handle config correctly, defaulting to 'production' if 'development' is missing
const config: any =
  dbConfig[env as keyof typeof dbConfig] || dbConfig.production;

if (!config) {
  throw new Error(`Database config not found for environment: ${env}`);
}

// ✅ Create Sequelize instance safely
const sequelize: seq.Sequelize = new seq.Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
  }
);

// ✅ Initialize models
const db: any = {};
db.User = initUser(sequelize);

// ✅ Attach Sequelize instances
db.sequelize = sequelize;
db.Sequelize = seq.Sequelize;

export default db;
