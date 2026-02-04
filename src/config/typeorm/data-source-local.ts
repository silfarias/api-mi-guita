import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const DataSourceConfigLocal: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT)!,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nonna',
  entities: [__dirname + '/../../schematics/**/entities/*.entity{.ts,.js}'],
  logging: false,
  synchronize: true,
  timezone: 'Z', // UTC timezone
  extra: {
    timezone: 'Z', // UTC timezone para MySQL2
    charset: 'utf8mb4',
    dateStrings: true,
  },
};

export const AppDataSource = new DataSource(DataSourceConfigLocal);