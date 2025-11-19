import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'
import UnauthorizedError from '../errors/unauthorized-error'
import UserModel from '../models/user'

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization')
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

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user || !res.locals.user.roles?.includes('admin')) {
    return next(new ForbiddenError('Доступ запрещён'))
  }
  next()
}

export default auth