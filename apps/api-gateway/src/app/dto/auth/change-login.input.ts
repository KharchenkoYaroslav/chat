import { IsString, IsNotEmpty } from 'class-validator';

export class ChangeLoginInput {
  @IsString()
  @IsNotEmpty()
  newLogin!: string;
}
