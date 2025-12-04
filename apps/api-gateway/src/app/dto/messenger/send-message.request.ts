import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageRequest {
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

