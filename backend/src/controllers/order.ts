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

        const rawLimit = parseInt(limitQuery as string, 10)
        if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 10) {
            return next(
                new BadRequestError('Параметр limit должен быть от 1 до 10')
            )
        }
        const limitNum = rawLimit

        const filters: FilterQuery<Partial<IOrder>> = {}
        if (status) {
            if (typeof status !== 'string') {
                return next(new BadRequestError('Некорректный параметр status'))
            }
            filters.status = status
        }

        const totalOrders = await Order.countDocuments(filters)
        const totalPages = Math.ceil(totalOrders / limitNum)

        res.status(200).json({
            Order,
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
        const userId = res.locals.user._id
        const phone = rawPhone
            ? String(rawPhone)
                  .replace(/[^\d+() -]/g, '')
                  .trim()
            : ''
        if (!phone || !/^\+?\d{5,15}$/.test(phone.replace(/[\s()+-]/g, ''))) {
            return next(new BadRequestError('Некорректный номер телефона'))
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

        return res.status(201).json(populated)
    } catch (error) {
        next(
            error instanceof MongooseError.ValidationError
                ? new BadRequestError(error.message)
                : error
        )
    }
}
