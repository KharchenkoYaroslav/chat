import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessengerController } from './app.controller';
import { MessengerService } from './app.service';
import { Message } from './entities/message.entity';
import { User } from './entities/user.entity';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Message]),
  ],
  controllers: [MessengerController],
  providers: [MessengerService],
})
export class AppModule {}
