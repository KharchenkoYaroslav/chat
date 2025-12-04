import { Controller, NotFoundException } from '@nestjs/common';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { MessengerService } from './app.service';

@Controller()
export class MessengerController {
  constructor(private readonly messangerService: MessengerService) {}

  @GrpcMethod('MessengerService', 'FindPerson')
  async findPerson(data: { name: string }): Promise<{ persons: { id: string; name: string }[] }> {
    const result = await this.messangerService.findPerson(data.name);
    return result;
  }

  @GrpcMethod('MessengerService', 'GetMessages')
  async getMessages(data: {
    participantA:string;
    participantB:string;
    lastMessageId: string | undefined;
  }) {
    const messages = await this.messangerService.getMessages(
      data.participantA,
      data.participantB,
      data.lastMessageId
    );
    if (messages === null) {
      throw new Error('No messages here');
    }
    return { messages };
  }

  @GrpcMethod('MessengerService', 'GetFullChatHistory')
  async getFullChatHistory(data: {
    participantA: string;
    participantB: string;
  }) {
    const messages = await this.messangerService.getFullChatHistory(
      data.participantA,
      data.participantB
    );
    return { messages };
  }

  @GrpcMethod('MessengerService', 'SendMessage')
  async sendMessage(data: {
    sender: string;
    recipient: string;
    content: string;
  }) {
    try {
      return await this.messangerService.sendMessage(
        data.sender,
        data.recipient,
        data.content
      );

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Message not sent');
    }
  }

  @GrpcMethod('MessengerService', 'EditMessage')
  async editMessage(data: { messageId: string; newContent: string }) {
    console.log(data.newContent);

    try {
      return await this.messangerService.editMessage(
        data.messageId,
        data.newContent
      );
    } catch {
      throw new Error('Message not edited');
    }
  }

  @GrpcMethod('MessengerService', 'DeleteMessage')
  async deleteMessage(data: { messageId: string }) {
    try {
      return await this.messangerService.deleteMessage(data.messageId);
    } catch {
      throw new Error('Message not deleted');
    }
  }

  @GrpcMethod('MessengerService', 'checkOwnership')
  async checkOwnership(data: { userId: string; messageId: string }) {
    const isOwner = await this.messangerService.checkOwnership(
      data.messageId,
      data.userId
    );

    return { success: isOwner };
  }

  @EventPattern('delete_user_messeges')
  async deleteUserMessages(data: { userId: string }) {
    try {
      await this.messangerService.deleteUserMessages(data.userId);
    } catch {
      throw new Error('Messages not deleted');
    }
    return { success: true };
  }
}
