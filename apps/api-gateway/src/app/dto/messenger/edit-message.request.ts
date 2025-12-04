import { IsString, IsNotEmpty } from 'class-validator';

export class EditMessageRequest {
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  newContent!: string;
}
