import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

export default function adminGuard(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const user = (req as any).user
    if (!user || !user.roles?.includes('admin')) {
        return next(new ForbiddenError('Доступ запрещён'))
    }
    next()
}
