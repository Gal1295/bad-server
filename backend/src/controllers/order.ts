// controllers/order.ts
import sanitizeHtml from 'sanitize-html'
import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types, Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import Order, { IOrder } from '../models/order'
import Product, { IProduct } from '../models/product'
import User from '../models/user'
import { phoneRegExp } from '../middlewares/validations' // Импортируем phoneRegExp из validations.ts
import escapeRegExp from '../utils/escapeRegExp'; // Импортируем escapeRegExp из нового файла

const MAX_LIMIT = 10

// --- getOrders, getOrdersCurrentUser, getOrderByNumber, getOrderCurrentUserByNumber, createOrder, updateOrder, deleteOrder остаются без изменений ---
// (Вставьте сюда оригинальные функции из предыдущего исправленного файла, они не изменились, кроме getOrders)

export const getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
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
            // 1. Санитизируем строку поиска от HTML
            const cleanSearch = sanitizeHtml(search, { allowedTags: [], allowedAttributes: {} });
            // 2. Экранируем специальные символы для RegExp
            const escapedSearch = escapeRegExp(cleanSearch);
            // 3. Создаём RegExp с экранированной строкой
            const searchRegex = new RegExp(escapedSearch, 'i');
            result = result.filter(order => {
                const matchesProductTitle = order.products?.some(
                    (product: any) => product.title && product.title.match(searchRegex)
                );
                const matchesOrderNumber = order.orderNumber?.toString().includes(cleanSearch); // Используем cleanSearch для чисел
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

        res.status(200).json({
            orders: processedResult,
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

// --- Остальные функции (getOrdersCurrentUser, getOrderByNumber, getOrderCurrentUserByNumber, createOrder, updateOrder, deleteOrder) остаются без изменений ---
// (Вставьте сюда остальные функции из предыдущего исправленного файла)

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
        // Валидация orderNumber может быть добавлена здесь, если необходимо,
        // но Mongoose обычно обрабатывает попытки ввода недопустимого ObjectID или инъекции в строке.
        // Если orderNumber всегда числовое, можно добавить parseInt и проверку.
        const orderNumberParam = req.params.orderNumber;
        // Простая проверка, что параметр не содержит очевидных инъекций (опционально)
        if (typeof orderNumberParam === 'string' && (orderNumberParam.includes('$') || orderNumberParam.includes('.'))) {
             // В зависимости от логики, можно вернуть 400 или 404
             // 404 более безопасно, если инъекция обнаружена
             return next(new NotFoundError('Заказ не найден'));
        }

        const order = await Order.findOne({ orderNumber: orderNumberParam })
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'));
        res.json(order);
    } catch (error) {
        // Обработка ошибки Mongoose, например, если orderNumber - не число, но в базе хранится как Number
        if ((error as any).name === 'DocumentNotFoundError') {
             return next(new NotFoundError('Заказ не найден'));
        }
        next(error); // Передаем другие ошибки (например, CastError) дальше
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
         // Простая проверка, что параметр не содержит очевидных инъекций (опционально)
         if (typeof orderNumberParam === 'string' && (orderNumberParam.includes('$') || orderNumberParam.includes('.'))) {
             // В зависимости от логики, можно вернуть 400 или 404
             // 404 более безопасно, если инъекция обнаружена
             return next(new NotFoundError('Заказ не найден'));
        }
        const order = await Order.findOne({
            orderNumber: orderNumberParam,
            customer: userId,
        })
            .populate(['customer', 'products'])
            .orFail(() => new NotFoundError('Заказ не найден'));
        res.json(order);
    } catch (error) {
        if ((error as any).name === 'DocumentNotFoundError') {
             return next(new NotFoundError('Заказ не найден'));
        }
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
        const { status, phone: rawPhone } = req.body; // Добавляем деструктуризацию phone

        const updateData: any = {};
        if (status !== undefined) {
            updateData.status = status;
        }
        if (rawPhone !== undefined) { // Проверяем, передан ли phone в теле запроса
            const phone = String(rawPhone).replace(/[^\d+]/g, '');
            if (!phone || phone.length < 10 || phone.length > 15 || !/^\+?\d+$/.test(phone)) {
                return next(new BadRequestError('Некорректный номер телефона'));
            }
            updateData.phone = phone; // Добавляем валидированный phone в объект обновления
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber }, // orderNumber из пути
            updateData, // Используем сформированный объект updateData
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
