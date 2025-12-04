import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginInput } from '../dto/auth/login.input';
import { RegisterInput } from '../dto/auth/register.input';
import { ChangeLoginInput } from '../dto/auth/change-login.input';
import { ChangePasswordInput } from '../dto/auth/change-password.input';
import { GetLoginInput } from '../dto/auth/get-login.input';
import { RestAuthGuard } from '../guards/auth.guard';

interface AuthRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  async getLogin(@Query() data: GetLoginInput) {
    if (!data.userId) throw new Error('User ID is required');
    return this.authService.getLogin({ userId: data.userId });
  }

  @Get('verify-token')
  async verifyToken(@Query() data: { token: string }) {
    return this.authService.verifyToken(data);
  }

  @Post('login')
  async login(@Body() data: LoginInput) {
    return this.authService.login(data);
  }

  @Post('register')
  async register(@Body() data: RegisterInput) {
    return this.authService.register(data);
  }

  @Patch('change-login')
  @UseGuards(RestAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLogin(@Body() data: ChangeLoginInput, @Req() req: AuthRequest) {
    const userId = req.user.sub;
    await this.authService.changeLogin({ ...data, userId });
    return;
  }

  @Patch('change-password')
  @UseGuards(RestAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() data: ChangePasswordInput,
    @Req() req: AuthRequest
  ) {
    const userId = req.user.sub;
    await this.authService.changePassword({ ...data, userId });
    return;
  }

  @Delete('delete-account')
  @UseGuards(RestAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Req() req: AuthRequest) {
    const userId = req.user.sub;
    await this.authService.deleteAccount({ userId });
    return;
  }


}
