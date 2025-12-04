import { IsString, IsNotEmpty } from 'class-validator';

export class FindPersonRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
