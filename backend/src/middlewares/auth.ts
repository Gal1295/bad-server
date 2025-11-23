import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import UserModel from '../models/user'

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Необходима авторизация' })
  }
  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, ACCESS_TOKEN.secret) as JwtPayload

    const user = await UserModel.findOne(
      { _id: new Types.ObjectId(payload.sub) },
      { password: 0 }
    )

    if (!user) {
      return res.status(403).send({ message: 'Доступ запрещён' })
    }
    res.locals.user = user
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({ message: 'Истёк срок действия токена' })
    }
    return res.status(401).send({ message: 'Невалидный токен' })
  }
}
export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user || !res.locals.user.roles?.includes('admin')) {
    return res.status(403).send({ message: 'Доступ запрещён' })
  }
  next()
}

export default auth
