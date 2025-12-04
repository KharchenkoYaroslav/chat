import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
      queue: 'messenger_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'messenger',
      protoPath: join(__dirname, 'proto/messenger.proto'),
      url: `${process.env.MESSENGER_SERVICE_URL || '0.0.0.0:4020'}`,
    },
  });

  await app.startAllMicroservices();

  Logger.log(
    `🚀 Application is running on: ${
      process.env.MESSENGER_SERVICE_URL || 'http://localhost:4020'
    }`
  );
}

bootstrap();
