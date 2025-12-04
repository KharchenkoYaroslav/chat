import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteMessageRequest {
  @IsString()
  @IsNotEmpty()
  messageId!: string;
}
