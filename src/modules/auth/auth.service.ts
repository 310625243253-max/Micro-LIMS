import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository.js';
import { LoginDto, RefreshTokenDto } from './auth.dto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { User, JwtAuthPayload } from '../../types/index.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const userWithPw = await this.authRepo.findByEmail(dto.email);
    if (!userWithPw) {
      throw new Error('Invalid email or password');
    }

    if (!userWithPw.is_active) {
      throw new Error('Account is deactivated. Please contact the laboratory administrator.');
    }

    const isMatch = await bcrypt.compare(dto.password, userWithPw.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const payload: JwtAuthPayload = {
      userId: userWithPw.id,
      email: userWithPw.email,
      roles: userWithPw.roles || [],
      firstName: userWithPw.first_name,
      lastName: userWithPw.last_name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: userWithPw.id });

    // Record login audit log
    await recordAuditLog({
      userId: userWithPw.id,
      userEmail: userWithPw.email,
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: userWithPw.id,
      newState: { email: userWithPw.email, roles: userWithPw.roles },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    const { password_hash, ...user } = userWithPw;

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(dto.refreshToken);
      const user = await this.authRepo.findById(decoded.userId);

      if (!user || !user.is_active) {
        throw new Error('User not found or deactivated');
      }

      const payload: JwtAuthPayload = {
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
        firstName: user.first_name,
        lastName: user.last_name,
      };

      const accessToken = signAccessToken(payload);
      return { accessToken };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new Error('User profile not found');
    }
    return user;
  }
}
