import { Inject, Injectable} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject('MESSENGER_PACKAGE')
    private messengerClient: ClientProxy
  ) {}

  async getLoginbyId(userId: string): Promise<string | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      return user.login;
    }
    return null;
  }

  async validateUser(
    login: string,
    password: string
  ): Promise<{ id: string; login: string; createdAt: Date } | null> {
    const user = await this.usersRepository.findOne({ where: { login } });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { id, login, createdAt } = user;
      return { id, login, createdAt };
    }
    return null;
  }

  async login(user: {
    id: string;
    login: string;
    createdAt: Date;
  }): Promise<string> {
    const payload = { login: user.login, sub: user.id };
    const token = this.jwtService.sign(payload);
    return token;
  }

  private async isLoginTaken(login: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { login } });
    return !!user;
  }

  async register(login: string, password: string): Promise<User> {
    if (await this.isLoginTaken(login)) {
      throw new Error('User with this login already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      login,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const savedUser = await this.usersRepository.save(user);

    // Тут може бути логіка ініціалізації інших сервісів

    return savedUser;
  }

  async changeLogin(userId: string, newLogin: string): Promise<void> {
    if (await this.isLoginTaken(newLogin)) {
      throw new Error('User with this login already exists');
    }
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.login = newLogin;
    this.usersRepository.save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    this.usersRepository.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    try {
      this.messengerClient.emit('delete_user_messeges', { userId });
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw new Error('Failed to delete profile');
    }
    await this.usersRepository.remove(user);
  }

  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; payload?: unknown }> {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, payload };
    } catch (error) {
      console.error(error);
      return { valid: false };
    }
  }
}
