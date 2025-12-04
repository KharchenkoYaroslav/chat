import {
  Inject,
  Injectable,
  OnModuleInit,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom, catchError } from 'rxjs';
import { FindPersonResponse } from '../dto/messenger/find-person.response';
import { SendMessageRequest } from '../dto/messenger/send-message.request';
import { MessageResponse } from '../dto/messenger/message.response';
import { EditMessageRequest } from '../dto/messenger/edit-message.request';
import { DeleteMessageRequest } from '../dto/messenger/delete-message.request';
import { DeleteMessageResponse } from '../dto/messenger/delete-message.response';
import { FindPersonRequest } from '../dto/messenger/find-person.request';
import { CheckOwnershipRequest } from '../dto/messenger/check-ownership.request';
import { GetMessagesRequest } from '../dto/messenger/get-messages.request';
import { GetMessagesResponse } from '../dto/messenger/get-messages.response';

interface MessengerServiceGrpc {
  FindPerson(data: FindPersonRequest): Observable<FindPersonResponse>;
  SendMessage(data: SendMessageRequest): Observable<MessageResponse>;
  EditMessage(data: EditMessageRequest): Observable<MessageResponse>;
  DeleteMessage(data: DeleteMessageRequest): Observable<DeleteMessageResponse>;
  CheckOwnership(data: CheckOwnershipRequest): Observable<{ success: boolean }>;
  GetMessages(data: GetMessagesRequest): Observable<GetMessagesResponse>;
  GetFullChatHistory(data: GetMessagesRequest): Observable<GetMessagesResponse>;
}

@Injectable()
export class MessengerService implements OnModuleInit {
  private messengerService!: MessengerServiceGrpc;

  constructor(@Inject('MESSENGER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.messengerService =
      this.client.getService<MessengerServiceGrpc>('MessengerService');
  }

  async findPerson(name: FindPersonRequest): Promise<FindPersonResponse> {
    return firstValueFrom(
      this.messengerService.FindPerson(name).pipe(
        catchError((error) => {
          throw new HttpException(error.details, HttpStatus.NOT_FOUND);
        })
      )
    );
  }

  async sendMessage(
    data: SendMessageRequest & { sender: string }
  ): Promise<MessageResponse> {
    return await firstValueFrom(
      this.messengerService.SendMessage(data).pipe(
        catchError((error) => {
          throw new HttpException(
            error.details,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        })
      )
    );
  }

  async editMessage(
    data: EditMessageRequest,
    sender: string
  ): Promise<MessageResponse> {
    const checkOwnership = await firstValueFrom(
      this.messengerService
        .CheckOwnership({ userId: sender, messageId: data.messageId })
        .pipe(
          catchError((error) => {
            throw new HttpException(error.details, HttpStatus.FORBIDDEN);
          })
        )
    );

    if (checkOwnership.success === false) {
      throw new ForbiddenException('User does not own the message');
    }
    return await firstValueFrom(
      this.messengerService.EditMessage(data).pipe(
        catchError((error) => {
          throw new HttpException(
            error.details,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        })
      )
    );
  }

  async deleteMessage(
    data: DeleteMessageRequest,
    sender: string
  ): Promise<DeleteMessageResponse> {
    const checkOwnership = await firstValueFrom(
      this.messengerService
        .CheckOwnership({ userId: sender, messageId: data.messageId })
        .pipe(
          catchError((error) => {
            throw new HttpException(error.details, HttpStatus.FORBIDDEN);
          })
        )
    );
    if (checkOwnership.success === false) {
      throw new ForbiddenException('User does not own the message');
    }
    return await firstValueFrom(
      this.messengerService.DeleteMessage(data).pipe(
        catchError((error) => {
          throw new HttpException(
            error.details,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        })
      )
    );
  }

  async getMessages(data: GetMessagesRequest): Promise<GetMessagesResponse> {
    return firstValueFrom(
      this.messengerService.GetMessages(data).pipe(
        catchError((error) => {
          throw new HttpException(
            error.details,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        })
      )
    );
  }

  async getFullChatHistory(data: GetMessagesRequest): Promise<GetMessagesResponse> {
    return firstValueFrom(this.messengerService.GetFullChatHistory(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    ));
  }
}
