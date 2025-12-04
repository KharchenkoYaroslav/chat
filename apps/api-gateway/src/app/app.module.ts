import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthController } from './controllers/auth.controller';
import { MessengerController} from './controllers/messenger.controller';
import { AuthService } from './services/auth.service';
import { MessengerService } from './services/messenger.servise';
import { MessengerGateway } from './getways/messenger.geteway';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, 'proto/auth.proto'),
          url: `${process.env.AUTH_SERVICE_URL || '0.0.0.0:4010'}`,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'MESSENGER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'messenger',
          protoPath: join(__dirname, 'proto/messenger.proto'),
          url: `${process.env.MESSENGER_SERVICE_URL || '0.0.0.0:4020'}`,
        },
      },
    ]),
  ],
  controllers: [AuthController, MessengerController],
  providers: [AuthService, MessengerService, MessengerGateway, WsAuthGuard],
})
export class AppModule {}
