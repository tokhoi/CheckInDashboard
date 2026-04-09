// config/env.js
const path = require('path');
const dotenv = require('dotenv');

// load file .env từ thư mục gốc dự án
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'localhost',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || '5672',
  RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || 'admin',
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || '123456',
  RABBITMQ_EXCHANGE_NAME: process.env.RABBITMQ_EXCHANGE_NAME || 'titkul_att_exchange',
  RABBITMQ_MAIN_QUEUE: process.env.RABBITMQ_MAIN_QUEUE || 'titkul_att_queue',
  RABBITMQ_BACKUP_EXCHANGE: process.env.RABBITMQ_BACKUP_EXCHANGE || 'backup_att_exchange',
  RABBITMQ_BACKUP_QUEUE: process.env.RABBITMQ_BACKUP_QUEUE || 'backup_att_queue',
  RABBITMQ_NOTIFY_EXCHANGE: process.env.RABBITMQ_NOTIFY_EXCHANGE || 'notify_exchange',
  RABBITMQ_NOTIFY_QUEUE: process.env.RABBITMQ_NOTIFY_QUEUE || 'notify_queue',

  POSTGRESQL_USER: process.env.POSTGRESQL_USER || 'postgres',
  POSTGRESQL_HOST: process.env.POSTGRESQL_HOST || 'localhost',
  POSTGRESQL_PASSWORD: process.env.POSTGRESQL_PASSWORD || '12312312',
  POSTGRESQL_PORT: process.env.POSTGRESQL_PORT || '5432'
};
