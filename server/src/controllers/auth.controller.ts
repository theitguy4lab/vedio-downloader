import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const { user, tokens } = await AuthService.register(validated, meta);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account successfully registered',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const { user, tokens } = await AuthService.login(validated, meta);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Successfully logged in',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = refreshSchema.parse(req.body);
    const token = req.cookies.refreshToken || validated.refreshToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        error: { code: 'REFRESH_TOKEN_REQUIRED' },
      });
      return;
    }

    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const tokens = await AuthService.refresh(token, meta);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    await AuthService.logout(token);
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await AuthService.getProfile(req.user!.userId);
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
