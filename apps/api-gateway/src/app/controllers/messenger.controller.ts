import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { MessengerService } from '../services/messenger.servise';
import { RestAuthGuard } from '../guards/auth.guard';
import { FindPersonRequest } from '../dto/messenger/find-person.request';
import { FindPersonResponse } from '../dto/messenger/find-person.response';
import { SendMessageRequest } from '../dto/messenger/send-message.request';
import { EditMessageRequest } from '../dto/messenger/edit-message.request';
import { DeleteMessageRequest } from '../dto/messenger/delete-message.request';
import { GetMessagesRequest } from '../dto/messenger/get-messages.request';
import { GetMessagesResponse } from '../dto/messenger/get-messages.response';
import { MessengerGateway } from '../getways/messenger.geteway';

interface AuthRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('messenger')
export class MessengerController {
  constructor(
    private readonly messengerService: MessengerService,
    private readonly messengerGateway: MessengerGateway
  )
  {}

  @Get('find-person')
  async findPerson(
    @Query() data: FindPersonRequest
  ): Promise<FindPersonResponse> {
    return this.messengerService.findPerson(data);
  }

  @UseGuards(RestAuthGuard)
  @Get('get-old-messages')
  async getOldMessages(
    @Query() data: GetMessagesRequest,
    @Req() req: AuthRequest
  ): Promise<GetMessagesResponse> {
    const currentUserId = req.user.sub;
    const { participantA, participantB } = data;

    if (currentUserId !== participantA && currentUserId !== participantB) {
      throw new Error('User is not a participant in this conversation');
    }

    return this.messengerService.getMessages(data);
  }

  @UseGuards(RestAuthGuard)
  @Get('download-history')
  async downloadHistory(
    @Query() data: GetMessagesRequest,
    @Req() req: AuthRequest,
  ): Promise<StreamableFile> {
    const currentUserId = req.user.sub;
    const { participantA, participantB } = data;

    if (currentUserId !== participantA && currentUserId !== participantB) {
      throw new Error('User is not a participant in this conversation');
    }

    const result = await this.messengerService.getFullChatHistory(data);

    const jsonContent = JSON.stringify(result.messages, null, 2);
    const buffer = Buffer.from(jsonContent);
    const fileName = `chat_history_${participantA}_${participantB}.json`;

    return new StreamableFile(buffer, {
      type: 'application/json',
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @UseGuards(RestAuthGuard)
  @Post('send-message')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendMessage(
    @Body() data: SendMessageRequest,
    @Req() req: AuthRequest
  ) {
    const sender = req.user.sub;
    const result = await this.messengerService.sendMessage({ ...data, sender });

    this.messengerGateway.sendNewMessage({
      id: result.id,
      sender,
      recipient: data.recipient,
      content: data.content,
      createdAt: result.createdAt
    });

    return;
  }

  @UseGuards(RestAuthGuard)
  @Patch('edit-message')
  @HttpCode(HttpStatus.NO_CONTENT)
  async editMessage(
    @Body() data: EditMessageRequest,
    @Req() req: AuthRequest
  ) {
    const sender = req.user.sub;
    const result = await this.messengerService.editMessage(data, sender);

    this.messengerGateway.sendEditedMessage({
      id: result.id,
      sender,
      recipient: result.recipient,
      content: result.content
    });

   return;
  }

  @UseGuards(RestAuthGuard)
  @Delete('delete-message')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Body() data: DeleteMessageRequest,
    @Req() req: AuthRequest
  ) {
    const sender = req.user.sub;
    const result = await this.messengerService.deleteMessage(data, sender);

    this.messengerGateway.sendDeletedMessage({
      id: result.id,
      sender,
      recipient: result.recipient
    });

    return;
  }
}
