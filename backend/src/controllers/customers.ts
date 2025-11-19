import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import escapeRegExp from '../utils/escapeRegExp'
const MAX_LIMIT = 10

export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pageNum = Math.max(1, parseInt(req.query.page as string || '1', 10))
      const limitNum = parseInt(req.query.limit as string || '10', 10)
      const search = req.query.search
  
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 10) {
        return next(new BadRequestError('Лимит должен быть от 1 до 10'))
      }
  
      const filters: FilterQuery<any> = {}
      if (search) {
        const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escaped, 'i')
        filters.$or = [{ name: regex }, { email: regex }]
      }
  
      const users = await User.find(filters)
        .select('-password')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .populate([
          'orders',
          { path: 'lastOrder', populate: { path: 'products' } },
          { path: 'lastOrder', populate: { path: 'customer' } },
        ])
  
      const totalUsers = await User.countDocuments(filters)
  
      res.json({
        customers: users,
        pagination: {
          totalUsers,
          totalPages: Math.ceil(totalUsers / limitNum),
          currentPage: pageNum,
          pageSize: limitNum,
        },
      })
    } catch (error) {
      next(error)
    }
  }

export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        if (!user) {
            return next(
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
            )
        }
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
