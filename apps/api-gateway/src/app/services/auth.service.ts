import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom, catchError } from 'rxjs';
import { LoginInput } from '../dto/auth/login.input';
import { RegisterInput } from '../dto/auth/register.input';
import { ChangeLoginInput } from '../dto/auth/change-login.input';
import { ChangePasswordInput } from '../dto/auth/change-password.input';
import { GetLoginInput } from '../dto/auth/get-login.input';
import { LoginResponse } from '../dto/auth/login.response';
import { GetLoginResponse } from '../dto/auth/get-login.response';

interface AuthServiceGrpc {
  getLogin(data: { userId: string }): Observable<GetLoginResponse>;
  login(data: LoginInput): Observable<LoginResponse>;
  verifyToken(data: { token: string }): Observable<{ valid: boolean }>;
  register(data: RegisterInput): Observable<LoginResponse>;
  changeLogin(data: ChangeLoginInput): Observable<{ success: boolean }>;
  changePassword(data: ChangePasswordInput): Observable<{ success: boolean }>;
  deleteAccount(data: { userId: string }): Observable<{ success: boolean }>;
}

@Injectable()
export class AuthService {
  private authService!: AuthServiceGrpc;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  async getLogin(data: GetLoginInput) {
    return firstValueFrom(this.authService.getLogin({ userId: data.userId }).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.NOT_FOUND);
      })
    ));
  }

  async login(data: LoginInput) {
    return firstValueFrom(this.authService.login(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.UNAUTHORIZED);
      })
    ));
  }

  async register(data: RegisterInput) {
    return firstValueFrom(this.authService.register(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.CONFLICT);
      })
    ));
  }

  async changeLogin(data: ChangeLoginInput & { userId: string }) {
    await firstValueFrom(this.authService.changeLogin(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.CONFLICT);
      })
    ));
  }

  async changePassword(data: ChangePasswordInput & { userId: string }) {
    await firstValueFrom(
      this.authService.changePassword(data).pipe(
        catchError(error => {
          throw new HttpException(error.details, HttpStatus.UNAUTHORIZED);
        })
      )
    );
  }

  async deleteAccount(data: { userId: string }) {
    await firstValueFrom(this.authService.deleteAccount(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    ));
  }

  async verifyToken(data: { token: string }) {
    const response = await firstValueFrom(this.authService.verifyToken(data).pipe(
      catchError(error => {
        throw new HttpException(error.details, HttpStatus.UNAUTHORIZED);
      })
    ));
    return { valid: response.valid };
  }
}
