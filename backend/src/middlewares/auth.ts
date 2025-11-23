import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'
import UnauthorizedError from '../errors/unauthorized-error'
import UserModel from '../models/user'

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization')
  console.log('🔐 AUTH MIDDLEWARE - Path:', req.path);
  console.log('🔐 Authorization header:', authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Необходима авторизация'))
  }
  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, ACCESS_TOKEN.secret) as JwtPayload

    const user = await UserModel.findOne(
      { _id: new Types.ObjectId(payload.sub) },
      { password: 0 }
    )

    if (!user) {
      return next(new ForbiddenError('Доступ запрещён'))
    }
    res.locals.user = user
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Истёк срок действия токена'))
    }
    return next(new UnauthorizedError('Невалидный токен'))
  }
}

// Исправленный adminGuard
export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 ADMIN GUARD - Checking roles:', res.locals.user?.roles);
  
  // Проверяем, что пользователь существует и имеет роль 'admin'
  if (!res.locals.user || !res.locals.user.roles?.includes('admin')) {
    console.log('❌ ADMIN GUARD - Access denied');
    // Возвращаем ошибку доступа, если пользователь не авторизован как админ
    return next(new ForbiddenError('Доступ запрещён'))
  }
  console.log('✅ ADMIN GUARD - Access granted');
  // Если всё в порядке, продолжаем выполнение
  next()
}

export default auth
