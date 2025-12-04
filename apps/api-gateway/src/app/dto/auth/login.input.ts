import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginInput {
  @IsString()
  @IsNotEmpty()
  login!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password must be at least 5 characters long' })
  password!: string;
}
