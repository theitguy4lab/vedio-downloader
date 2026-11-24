import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { User, IUserDocument } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { AppError } from '../middlewares/errorHandler.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import { UserRole } from '../types/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  storageUsageBytes: number;
  preferences: IUserDocument['preferences'];
  createdAt: Date;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sanitizeUser(user: IUserDocument): UserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    storageUsageBytes: user.storageUsageBytes,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  private static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: payload.userId, tokenType: 'refresh' },
      env.JWT_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  private static async createSession(
    userId: Types.ObjectId,
    refreshToken: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

    await Session.create({
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: meta?.ip || '',
      userAgent: meta?.userAgent || '',
      expiresAt,
    });
  }

  public static async register(
    input: RegisterInput,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await User.hashPassword(input.password);

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
    });

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.createSession(user._id, tokens.refreshToken, meta);

    return {
      user: sanitizeUser(user),
      tokens,
    };
  }

  public static async login(
    input: LoginInput,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.createSession(user._id, tokens.refreshToken, meta);

    return {
      user: sanitizeUser(user),
      tokens,
    };
  }

  public static async refresh(
    refreshToken: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<AuthTokens> {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (!decoded.userId || decoded.tokenType !== 'refresh') {
      throw new AppError('Invalid refresh token payload', 401, 'INVALID_REFRESH_TOKEN');
    }

    const hashed = hashToken(refreshToken);
    const session = await Session.findOneAndDelete({
      userId: decoded.userId,
      refreshTokenHash: hashed,
    });

    if (!session) {
      throw new AppError('Refresh session expired or already revoked', 401, 'SESSION_REVOKED');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401, 'USER_INACTIVE');
    }

    const newTokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.createSession(user._id, newTokens.refreshToken, meta);

    return newTokens;
  }

  public static async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await Session.findOneAndDelete({ refreshTokenHash: hashed });
    }
  }

  public static async getProfile(userId: string): Promise<UserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return sanitizeUser(user);
  }
}
