import sanitizeHtml from 'sanitize-html'
import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types, Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import Order, { IOrder } from '../models/order'
import Product, { IProduct } from '../models/product'
import User from '../models/user'

const MAX_LIMIT = 10

export const getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let page = Math.max(1, parseInt(req.query.page as string || '1', 10))
        let limit = parseInt(req.query.limit as string || '10', 10)

        if (isNaN(limit) || limit < 1) limit = 10
        limit = Math.min(limit, MAX_LIMIT)

        const filters: FilterQuery<any> = {}
        if (req.query.status && typeof req.query.status === 'string') {
            filters.status = req.query.status
        }

        const orders = await Order.find(filters)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('customer', 'name email')
            .populate('products')

        const result = orders.map(order => {
            if (order.products && Array.isArray(order.products) && order.products.length > 10) {
                order.products = order.products.slice(0, 10)
            }
            return order
        })

        const totalOrders = await Order.countDocuments(filters)

        res.status(200).json({
            orders: result,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                pageSize: limit,
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

        let page = Math.max(1, parseInt(req.query.page as string || '1', 10))
        let limit = parseInt(req.query.limit as string || '10', 10)

        if (isNaN(limit) || limit < 1) limit = 10
        limit = Math.min(limit, MAX_LIMIT)

        const orders = await Order.find({ customer: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('products')
            .populate('customer', 'name email')

        const result = orders.map(order => {
            if (order.products && Array.isArray(order.products) && order.products.length > 10) {
                order.products = order.products.slice(0, 10)
            }
            return order
        })

        const totalOrders = await Order.countDocuments({ customer: userId })

        res.json({
            orders: result,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                pageSize: limit,
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
        const order = await Order.findOne({ orderNumber: req.params.orderNumber })
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'))
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
            .orFail(() => new NotFoundError('Заказ не найден'))
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
        if (!phone || phone.length < 10 || phone.length > 15 || !/^\+?\d+$/.test(phone)) {
            return next(new BadRequestError('Некорректный номер телефона'))
        }

        const userId = res.locals.user?._id
        if (!userId) {
            return next(new BadRequestError('Пользователь не авторизован'))
        }

        const cleanComment = comment
            ? sanitizeHtml(String(comment), { allowedTags: [], allowedAttributes: {} })
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
        next(error instanceof MongooseError.ValidationError
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
            .orFail(() => new NotFoundError('Заказ не найден'))
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
        const deletedOrder = await Order.findOneAndDelete({ 
            orderNumber: req.params.orderNumber 
        }).orFail(
            () => new NotFoundError('Заказ не найден')
        )
        res.json(deletedOrder)
    } catch (error) {
        next(error)
    }
}
