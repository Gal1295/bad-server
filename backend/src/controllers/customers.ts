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
        let limitValue = Number(req.query.limit) || 10
        if (Number.isNaN(limitValue) || limitValue <= 0) {
            limitValue = 10
        }
        if (limitValue > MAX_LIMIT) {
            return next(new BadRequestError('Лимит не может превышать 10'))
        }
        const limit = limitValue

        let pageValue = Number(req.query.page) || 1
        if (Number.isNaN(pageValue) || pageValue < 1) {
            pageValue = 1
        }
        const page = pageValue
        const {
            sortField = 'createdAt',
            sortOrder = 'desc',
            search,
        } = req.query
        const filters: FilterQuery<Partial<IUser>> = {}

        if (search) {
            const searchStr = String(search)
            const safeSearch = escapeRegExp(searchStr)
            const searchRegex = new RegExp(safeSearch, 'i')
            filters.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ]
        }

        const sort: { [key: string]: any } = {}
        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        const options = {
            sort,
            skip: (page - 1) * limit,
            limit,
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: { path: 'products' },
            },
            {
                path: 'lastOrder',
                populate: { path: 'customer' },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.status(200).json({
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
