import { Injectable, NotFoundException } from '@nestjs/common';
import { Message } from './entities/message.entity';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MessengerService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async findPerson(
    name: string
  ): Promise<{ persons: { id: string; name: string }[] }> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.login ILIKE :name', { name: `%${name}%` })
      .orderBy('user.login', 'ASC')
      .limit(10)
      .getMany();
    return {
      persons: users.map((user) => ({ id: user.id, name: user.login })),
    };
  }

  async getMessages(
    participantA: string,
    participantB: string,
    lastMessageId: string | undefined
  ): Promise<Message[] | null> {
    const { participantA: userA, participantB: userB } = {
      participantA,
      participantB,
    };

    let query = this.messageRepository
      .createQueryBuilder('message')
      .where(
        '((message.sender = :userA AND message.recipient = :userB) OR (message.sender = :userB AND message.recipient = :userA))',
        { userA, userB }
      );

    if (lastMessageId !== undefined) {
      const lastMessage = await this.messageRepository.findOne({
        where: { id: lastMessageId },
      });
      if (!lastMessage) return null;

      query = query.andWhere(
        'message.createdAt < (SELECT msg."createdAt" FROM message msg WHERE msg.id = :lastMessageId)',
        {
          lastMessageId: lastMessageId,
        }
      );
    }

    const messages = await query
      .orderBy('message.createdAt', 'DESC')
      .limit(100)
      .getMany();

    return messages;
  }

  async getFullChatHistory(
    participantA: string,
    participantB: string
  ): Promise<Message[]> {
    const { participantA: userA, participantB: userB } = {
      participantA,
      participantB,
    };

    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .where(
        '((message.sender = :userA AND message.recipient = :userB) OR (message.sender = :userB AND message.recipient = :userA))',
        { userA, userB }
      )
      .orderBy('message.createdAt', 'ASC')
      .getMany();

    return messages;
  }

  async sendMessage(
    sender: string,
    recipient: string,
    content: string
  ): Promise<Message> {
    const senderUser = await this.userRepository.findOne({
      where: { id: sender },
    });
    const recipientUser = await this.userRepository.findOne({
      where: { id: recipient },
    });

    if (!senderUser) {
      throw new NotFoundException(`Sender with ID ${sender} not found`);
    }
    if (!recipientUser) {
      throw new NotFoundException(`Recipient with ID ${recipient} not found`);
    }

    const message = this.messageRepository.create({
      sender,
      recipient,
      content,
    });
    return this.messageRepository.save(message);
  }

  async editMessage(
    messageId: string,
    newContent: string
  ): Promise<Message | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) {
      return null;
    }
    message.content = newContent;
    console.log('Edited message:', message);

    return this.messageRepository.save(message);
  }

  async deleteMessage(
    messageId: string
  ): Promise<{ id: string; sender: string; recipient: string } | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    if (!message) {
      return null;
    }
    const result = await this.messageRepository.delete({ id: messageId });
    if (!result.affected || result.affected === 0) {
      return null;
    }
    return {
      id: message.id,
      sender: message.sender,
      recipient: message.recipient,
    };
  }

  async deleteUserMessages(userId: string): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where('sender = :userId OR recipient = :userId', { userId })
      .execute();
  }

  async checkOwnership(messageId: string, userId: string): Promise<boolean> {
    const message = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.id = :messageId', { messageId })
      .andWhere('message.sender = :userId', { userId })
      .getOne();
    return !!message;
  }
}
