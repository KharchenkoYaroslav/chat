import { IsString, IsNotEmpty } from 'class-validator';

export class GetLoginInput {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
