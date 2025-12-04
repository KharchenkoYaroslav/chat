import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GetMessagesRequest {
  @IsString()
  @IsNotEmpty()
  participantA!: string;

  @IsString()
  @IsNotEmpty()
  participantB!: string;

  @IsString()
  @IsOptional()
  lastMessageId?: string;
}
