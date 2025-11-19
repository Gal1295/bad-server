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
        let page = Math.max(1, parseInt(req.query.page as string || '1', 10))
        let limit = parseInt(req.query.limit as string || '10', 10)
        
        // Нормализация лимита
        limit = Math.min(Math.max(1, limit), 10)

        const search = req.query.search
        const filters: FilterQuery<IUser> = {}

        if (search) {
            const escaped = escapeRegExp(String(search))
            const regex = new RegExp(escaped, 'i')
            filters.$or = [{ name: regex }, { email: regex }]
        }

        const users = await User.find(filters)
            .select('-password -tokens -roles')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('orders')
            .populate({
                path: 'lastOrder',
                populate: [
                    { path: 'products' },
                    { path: 'customer', select: 'name email' }
                ]
            })

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
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
            return next(new NotFoundError('Пользователь не найден'))
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
            .orFail(() => new NotFoundError('Пользователь не найден'))
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
            () => new NotFoundError('Пользователь не найден')
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
