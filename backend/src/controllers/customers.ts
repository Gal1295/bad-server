import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import User, { IUser } from '../models/user'
import escapeRegExp from '../utils/escapeRegExp'

const normalizeLimit = (limit: any, max = 10): number => {
    const parsed = parseInt(limit as string, 10)
    return Math.min(Number.isNaN(parsed) ? max : parsed, max)
}

export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
        const limit = normalizeLimit(req.query.limit, 10)
        const { search, sortField = 'name', sortOrder = 'asc' } = req.query

        const filters: FilterQuery<Partial<IUser>> = {}

        if (search && typeof search === 'string') {
            const escapedSearch = escapeRegExp(search)
            const searchRegex = new RegExp(escapedSearch, 'i')
            filters.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ]
        }

        const sort: { [key: string]: any } = {}
        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        const users = await User.find(filters)
            .select('-password -salt')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.status(200).json({
            users,
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
        const user = await User.findById(req.params.id)
            .select('-password -salt')
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )

        return res.status(200).json(user)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID пользователя'))
        }
        return next(error)
    }
}

export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email } = req.body
        const updateData: any = {}

        if (name) updateData.name = name
        if (email) updateData.email = email

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .select('-password -salt')
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )

        return res.status(200).json(updatedUser)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID пользователя'))
        }
        return next(error)
    }
}

export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await User.findByIdAndDelete(req.params.id)
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )

        return res.status(200).json({ message: 'Пользователь удален' })
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID пользователя'))
        }
        return next(error)
    }
}
