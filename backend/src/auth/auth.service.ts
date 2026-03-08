import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const user = await this.usersService.createCustomer(email, password);
    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await this.usersService.setCurrentRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await this.usersService.setCurrentRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>(
            'JWT_REFRESH_SECRET',
            'refresh-secret',
          ),
        },
      );
      const user = await this.usersService.validateRefreshToken(
        payload.sub,
        refreshToken,
      );
      const tokens = await this.issueTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      await this.usersService.setCurrentRefreshToken(
        user.id,
        tokens.refreshToken,
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    const user = await this.usersService.findById(userId).catch(() => {
      throw new NotFoundException('User not found');
    });
    await this.usersService.clearCurrentRefreshToken(user.id);

    return { message: 'Logged out successfully' };
  }

  private async issueTokens(payload: JwtPayload) {
    const accessTokenTtl = this.configService.get<string>(
      'JWT_ACCESS_TTL',
      '15m',
    );
    const refreshTokenTtl = this.configService.get<string>(
      'JWT_REFRESH_TTL',
      '7d',
    );
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access-secret',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'refresh-secret',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessTokenTtl as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTokenTtl as never,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
