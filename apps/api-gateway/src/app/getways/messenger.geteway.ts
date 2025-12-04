import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@WebSocketGateway({ namespace: '/messenger', cors: { origin: '*' } })
export class MessengerGateway
{
  @WebSocketServer()
  server!: Server;

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { participantA: string; participantB: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user?.sub;

    if (userId !== data.participantA && userId !== data.participantB) {
      throw new WsException('User is not a participant');
    }

    const room = [data.participantA, data.participantB].sort().join('_');
    client.join(room);

    return { msg: 'joined', room };
  }

  sendNewMessage(message: { id: string, sender: string; recipient: string; content: string, createdAt: string }) {
    const room = [message.sender, message.recipient].sort().join('_');
    this.server.to(room).emit('new-message', message);
  }

  sendEditedMessage(message: { id: string, sender: string; recipient: string; content: string }) {
    const room = [message.sender, message.recipient].sort().join('_');
    this.server.to(room).emit('edit-message', message);
  }

  sendDeletedMessage(message: { id: string, sender: string; recipient: string }) {
    const room = [message.sender, message.recipient].sort().join('_');
    this.server.to(room).emit('delete-message', message.id);
  }
}
