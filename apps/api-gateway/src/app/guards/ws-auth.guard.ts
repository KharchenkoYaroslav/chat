import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { Observable, firstValueFrom } from 'rxjs';
import { Socket } from 'socket.io';

interface AuthServiceGrpc {
  verifyToken(data: {
    token: string;
  }): Observable<{ valid: boolean; sub: string; login: string }>;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private authService!: AuthServiceGrpc;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;

    if (!token) {
      throw new WsException('No authorization token');
    }

    try {
      const response = await firstValueFrom(this.authService.verifyToken({ token }));
      if (!response.valid) {
        throw new WsException('Invalid token');
      }
      client.data.user = { sub: response.sub, login: response.login };
      return true;
    } catch (error) {
      throw new WsException('Invalid token: ' + error);
    }
  }
}
