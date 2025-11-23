import sanitizeHtml from 'sanitize-html'
import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types, Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import Order, { IOrder } from '../models/order'

const MAX_LIMIT = 10

export const getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('=== GET ORDERS CALLED ===');

        let page = 1;
        const rawPage = req.query.page as string | undefined;
        if (rawPage !== undefined) {
            const parsedPage = parseInt(rawPage, 10);
            if (isNaN(parsedPage)) {
                return next(new BadRequestError('Параметр page должен быть числом'));
            }
            page = Math.max(1, parsedPage);
        }

        let limit = 10;
        const rawLimit = req.query.limit as string | undefined;
        if (rawLimit !== undefined) {
            const parsedLimit = parseInt(rawLimit, 10);
            if (isNaN(parsedLimit)) {
                return next(new BadRequestError('Параметр limit должен быть числом'));
            }
            if (parsedLimit < 1) {
                return next(new BadRequestError('Параметр limit должен быть больше 0'));
            }
            limit = Math.min(parsedLimit, MAX_LIMIT);
        }

        console.log('📋 Raw limit from query:', rawLimit);
        console.log('✅ Final limit after normalization:', limit);

        const unsafeKeys = Object.keys(req.query).filter(key =>
            key.startsWith('$') || key.includes('__proto__') || key.includes('constructor')
        );
        if (unsafeKeys.length > 0) {
            return next(new BadRequestError('Invalid query parameters'));
        }

        const status = req.query.status as string | undefined;
        const filters: FilterQuery<any> = {};
        if (status) {
            filters.status = status;
        }

        const orders = await Order.find(filters)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('customer', 'name email')
            .populate('products');

        let result = orders;
        const search = req.query.search as string | undefined;
        if (search) {
            const cleanSearch = sanitizeHtml(search, { allowedTags: [], allowedAttributes: {} });
            result = result.filter(order => {
                const matchesProductTitle = order.products?.some(
                    (product: any) => product.title && product.title.toLowerCase().includes(cleanSearch.toLowerCase())
                );
                const matchesOrderNumber = order.orderNumber?.toString().includes(cleanSearch);
                return matchesProductTitle || matchesOrderNumber;
            });
        }

        const processedResult = result.map(order => {
            if (order.products && Array.isArray(order.products) && order.products.length > 10) {
                order.products = order.products.slice(0, 10);
            }
            return order;
        });

        const totalOrders = await Order.countDocuments(filters);

        console.log('📊 Final page:', page, 'Final limit:', limit);
        console.log('✅ Sending successful response');

        res.status(200).json({
            orders: processedResult,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                pageSize: limit, // ✅ ВАЖНО: возвращаем нормализованный лимит
            },
        });
    } catch (error) {
        console.error('Error getting orders:', error);
        next(error);
    }
};

// ... остальные функции без изменений

export const getOrdersCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id;
        let page = 1;
        const rawPage = req.query.page as string | undefined;
        if (rawPage !== undefined) {
            const parsedPage = parseInt(rawPage, 10);
            if (isNaN(parsedPage)) {
                return next(new BadRequestError('Параметр page должен быть числом'));
            }
            page = Math.max(1, parsedPage);
        }

        let limit = 10;
        const rawLimit = req.query.limit as string | undefined;
        if (rawLimit !== undefined) {
            const parsedLimit = parseInt(rawLimit, 10);
            if (isNaN(parsedLimit)) {
                return next(new BadRequestError('Параметр limit должен быть числом'));
            }
            if (parsedLimit < 1) {
                return next(new BadRequestError('Параметр limit должен быть больше 0'));
            }
            limit = Math.min(parsedLimit, MAX_LIMIT);
        }

        const orders = await Order.find({ customer: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('products')
            .populate('customer', 'name email');

        const result = orders.map(order => {
            if (order.products && Array.isArray(order.products) && order.products.length > 10) {
                order.products = order.products.slice(0, 10);
            }
            return order;
        });

        const totalOrders = await Order.countDocuments({ customer: userId });

        res.json({
            orders: result,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const orderNumberParam = req.params.orderNumber;
        
        // ✅ Простая валидация номера заказа
        const orderNumber = parseInt(orderNumberParam, 10);
        if (isNaN(orderNumber)) {
            return next(new BadRequestError('Некорректный номер заказа'));
        }

        const order = await Order.findOne({ orderNumber: orderNumber })
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'));
        res.json(order);
    } catch (error) {
        next(error);
    }
};

export const getOrderCurrentUserByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id;
        const orderNumberParam = req.params.orderNumber;
        
        const orderNumber = parseInt(orderNumberParam, 10);
        if (isNaN(orderNumber)) {
            return next(new BadRequestError('Некорректный номер заказа'));
        }

        const order = await Order.findOne({
            orderNumber: orderNumber,
            customer: userId,
        })
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'));
        res.json(order);
    } catch (error) {
        next(error);
    }
};

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
        
        // ✅ ВАЖНО: Проверка телефона должна возвращать 400 при ошибке
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
        // ✅ Обработка ошибок валидации Mongoose
        if (error instanceof MongooseError.ValidationError) {
            const messages = Object.values(error.errors).map(err => err.message);
            return next(new BadRequestError(messages.join(', ')));
        }
        next(error);
    }
}

export const updateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status, phone: rawPhone } = req.body;

        const orderNumberParam = req.params.orderNumber;
        const orderNumber = parseInt(orderNumberParam, 10);
        if (isNaN(orderNumber)) {
            return next(new BadRequestError('Некорректный номер заказа'));
        }

        const updateData: any = {};
        if (status !== undefined) {
            updateData.status = status;
        }
        if (rawPhone !== undefined) {
            const phone = String(rawPhone).replace(/[^\d+]/g, '');
            if (!phone || phone.length < 10 || phone.length > 15 || !/^\+?\d+$/.test(phone)) {
                return next(new BadRequestError('Некорректный номер телефона'));
            }
            updateData.phone = phone;
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: orderNumber },
            updateData,
            { new: true, runValidators: true }
        )
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'));
        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

export const deleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const orderNumberParam = req.params.orderNumber;
        const orderNumber = parseInt(orderNumberParam, 10);
        if (isNaN(orderNumber)) {
            return next(new BadRequestError('Некорректный номер заказа'));
        }

        const deletedOrder = await Order.findOneAndDelete({
            orderNumber: orderNumber
        }).orFail(
            () => new NotFoundError('Заказ не найден')
        )
        res.json(deletedOrder)
    } catch (error) {
        next(error)
    }
}
