// config/rabbitmq.js
const amqp = require('amqplib');
const env = require('./env');
let channel = null;
let connection = null;

const EXCHANGE_NAME = env.RABBITMQ_EXCHANGE_NAME;
const MAIN_QUEUE = env.RABBITMQ_MAIN_QUEUE;
const BACKUP_EXCHANGE = env.RABBITMQ_BACKUP_EXCHANGE;
const BACKUP_QUEUE = env.RABBITMQ_BACKUP_QUEUE;
const NOTIFY_EXCHANGE = env.RABBITMQ_NOTIFY_EXCHANGE;
const NOTIFY_QUEUE = env.RABBITMQ_NOTIFY_QUEUE;

async function connectRabbitMQ() {
  if (connection && channel) return { connection, channel };
  try {
    connection = await amqp.connect(`amqp://${env.RABBITMQ_USERNAME}:${env.RABBITMQ_PASSWORD}@${env.RABBITMQ_URL}:${env.RABBITMQ_PORT}`);
    channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertExchange(BACKUP_EXCHANGE, "topic", { durable: true });
    await channel.assertExchange(NOTIFY_EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(MAIN_QUEUE, { durable: true });
    await channel.assertQueue(BACKUP_QUEUE, { durable: true });
    await channel.assertQueue(NOTIFY_QUEUE, { durable: true });
    await channel.bindQueue(MAIN_QUEUE, EXCHANGE_NAME, "truong.#.camera.#");
    await channel.bindQueue(NOTIFY_QUEUE, NOTIFY_EXCHANGE, "truong.#.camera.#");
    await channel.bindQueue(BACKUP_QUEUE, BACKUP_EXCHANGE, "error.#");

  } catch (err) {
    console.error("Lỗi kết nối RabbitMQ:", err);
  }
}

// Publish message
async function PublishDataAttendance(attendanceRecord) {
  if (!channel) throw new Error("RabbitMQ channel not ready");

  const { deviceId, mode } = attendanceRecord;
  const routingKey = `truong.${deviceId}.camera.${mode}`;

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(attendanceRecord)),
    { persistent: true }
  );

  //console.log(`Published to ${routingKey}`);
}
//
// Publish message
async function PublishDataNotify(notifyRecord) {
  if (!channel) throw new Error("RabbitMQ channel not ready");

  const { ma_truong_bo } = notifyRecord;
  const routingKey = `ma_truong_bo.${ma_truong_bo}`;

  channel.publish(
    NOTIFY_EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(notifyRecord)),
    { persistent: true }
  );

  //console.log(`Published to ${routingKey}`);
}
//get channel hiện tại
function getChannel() {
  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  PublishDataAttendance,
  PublishDataNotify,
  EXCHANGE_NAME,
  MAIN_QUEUE,
  BACKUP_EXCHANGE,
  BACKUP_QUEUE,
  NOTIFY_EXCHANGE,
  NOTIFY_QUEUE
};