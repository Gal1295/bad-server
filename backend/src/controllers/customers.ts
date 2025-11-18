import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'

export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page: pageQuery = 1,
            limit: limitQuery = 10,
            sortField = 'createdAt',
            sortOrder = 'desc',
            search,
        } = req.query

        let pageNum = parseInt(pageQuery as string, 10)
        if (isNaN(pageNum) || pageNum < 1) pageNum = 1

        let limitNum = parseInt(limitQuery as string, 10)
        if (isNaN(limitNum) || limitNum < 1) limitNum = 10
        limitNum = Math.min(limitNum, 10)

        const filters: FilterQuery<Partial<IUser>> = {}

        if (search) {
            const escaped = String(search).replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )
            const regex = new RegExp(escaped, 'i')
            const ordersWithAddress = await Order.find(
                { deliveryAddress: regex },
                'customer'
            )
            const customerIdsFromOrders: Types.ObjectId[] = ordersWithAddress
                .map((o) => o.customer)
                .filter((id): id is Types.ObjectId => id !== undefined)

            filters.$or = [
                { name: regex },
                { email: regex },
                { _id: { $in: customerIdsFromOrders } },
            ]
        }

        const sort: { [key: string]: any } = {}
        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        const options = {
            sort,
            skip: (pageNum - 1) * limitNum,
            limit: limitNum,
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
        const totalPages = Math.ceil(totalUsers / limitNum)

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
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
            { new: true }
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
