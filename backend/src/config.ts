import { CookieOptions } from 'express'
import ms from 'ms'

export const PORT = process.env.PORT || '3000'
export const DB_ADDRESS = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek'
export const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET || 'my-super-secret-key-for-tokens-12345',
  expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m',
}
export const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET || 'my-super-secret-key-for-refresh-tokens-12345',
  expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
  cookie: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
      path: '/',
    } as CookieOptions,
  },
}

export const CSRF_COOKIE = {
  name: 'csrfToken',
  options: {
    httpOnly: false, 
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  },
}

export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'images'
export const UPLOAD_PATH_TEMP = process.env.UPLOAD_PATH_TEMP || 'temp'
export const ORIGIN_ALLOW = process.env.ORIGIN_ALLOW || 'http://localhost:5173'