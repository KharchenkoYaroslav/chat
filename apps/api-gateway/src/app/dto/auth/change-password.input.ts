import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordInput {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'New password must be at least 5 characters long' })
  newPassword!: string;
}
