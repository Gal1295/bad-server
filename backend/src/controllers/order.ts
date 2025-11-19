import sanitizeHtml from 'sanitize-html'
import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types, Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import Order, { IOrder } from '../models/order'
import Product, { IProduct } from '../models/product'
import User from '../models/user'

export const getOrders = async (
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
            status,
        } = req.query

        const pageNum = Math.max(1, parseInt(pageQuery as string, 10) || 1)
        let limitNum = parseInt(limitQuery as string, 10)
        
        if (isNaN(limitNum) || limitNum < 1) {
            limitNum = 10
        }
        if (limitNum > 10) {
            return next(new BadRequestError('Лимит не может превышать 10'))
        }

        const filters: FilterQuery<Partial<IOrder>> = {}
        if (status && typeof status === 'string') {
            filters.status = status
        }

        const sort: any = {}
        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        const orders = await Order.find(filters)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate(['customer', 'products'])

        const totalOrders = await Order.countDocuments(filters)
        const totalPages = Math.ceil(totalOrders / limitNum)

        res.status(200).json({
            orders,
            pagination: {
                totalOrders,
                totalPages,
                currentPage: pageNum,
                pageSize: limitNum,
            },
        })
    } catch (error) {
        next(error)
    }
}

export const getOrdersCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id

        const pageNum = Math.max(1, parseInt(req.query.page as string || '1', 10))
        let limitNum = parseInt(req.query.limit as string || '10', 10)

        if (isNaN(limitNum) || limitNum < 1) {
            limitNum = 10
        }
        if (limitNum > 10) {
            return next(new BadRequestError('Лимит не может превышать 10'))
        }

        const orders = await Order.find({ customer: userId })
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate(['products', 'customer'])

        const totalOrders = await Order.countDocuments({ customer: userId })

        res.json({
            orders,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limitNum),
                currentPage: pageNum,
                pageSize: limitNum,
            },
        })
    } catch (error) {
        next(error)
    }
}

export const getOrderByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
        })
            .populate(['customer', 'products'])
            .orFail(new NotFoundError('Заказ не найден'))

        res.json(order)
    } catch (error) {
        next(error)
    }
}

export const getOrderCurrentUserByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
            customer: userId,
        })
            .populate(['customer', 'products'])
            .orFail(new NotFoundError('Заказ не найден'))

        res.json(order)
    } catch (error) {
        next(error)
    }
}

export const createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            phone: rawPhone,
            comment,
            items,
            total,
            address,
            payment,
            email,
        } = req.body
        const phone = rawPhone ? String(rawPhone).replace(/[^\d+]/g, '') : ''
        if (
            !phone ||
            phone.length < 10 ||
            phone.length > 15 ||
            !/^\+?\d+$/.test(phone)
        ) {
            return next(new BadRequestError('Некорректный номер телефона'))
        }
        const userId = res.locals.user?._id
        if (!userId) {
            return next(new BadRequestError('Пользователь не авторизован'))
        }
        const cleanComment = comment
            ? sanitizeHtml(String(comment), {
                  allowedTags: [],
                  allowedAttributes: {},
              })
            : ''

        const newOrder = new Order({
            totalAmount: total,
            products: items,
            payment,
            phone,
            email,
            comment: cleanComment,
            customer: userId,
            deliveryAddress: address,
        })

        const populated = await newOrder.populate(['customer', 'products'])
        await populated.save()

        res.status(201).json(populated)
    } catch (error) {
        next(
            error instanceof MongooseError.ValidationError
                ? new BadRequestError(error.message)
                : error
        )
    }
}

export const updateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status } = req.body
        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber },
            { status },
            { new: true, runValidators: true }
        )
            .populate(['customer', 'products'])
            .orFail(new NotFoundError('Заказ не найден'))

        res.json(updatedOrder)
    } catch (error) {
        next(error)
    }
}

export const deleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(
            req.params.id
        ).orFail(new NotFoundError('Заказ не найден'))

        res.json(deletedOrder)
    } catch (error) {
        next(error)
    }
}
