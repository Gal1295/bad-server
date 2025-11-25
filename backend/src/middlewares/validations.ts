import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'

// eslint-disable-next-line no-useless-escape
export const phoneRegExp = /^[\+]?[0-9\s\-\(\)]{10,15}$/

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

// Функция для базовой санитизации строк
const sanitizeString = (value: string) => {
    if (typeof value !== 'string') return value
    return value
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#x27;')
        .replace(/"/g, '&quot;')
}

export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .min(1)
            .required()
            .messages({
                'array.empty': 'Не указаны товары',
                'array.min': 'Должен быть хотя бы один товар',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().email().required().custom(sanitizeString).messages({
            'string.empty': 'Не указан email',
            'string.email': 'Неверный формат email',
        }),
        phone: Joi.string().required().pattern(phoneRegExp).min(10).max(15).custom(sanitizeString).messages({
            'string.empty': 'Не указан телефон',
            'string.pattern.base': 'Неверный формат телефона',
            'string.min': 'Телефон слишком короткий',
            'string.max': 'Телефон слишком длинный',
        }),
        address: Joi.string().required().max(200).custom(sanitizeString).messages({
            'string.empty': 'Не указан адрес',
            'string.max': 'Адрес слишком длинный',
        }),
        total: Joi.number().required().min(0).max(1000000).messages({
            'number.base': 'Не указана сумма заказа',
            'number.min': 'Сумма заказа не может быть отрицательной',
            'number.max': 'Сумма заказа слишком большая',
        }),
        comment: Joi.string().optional().allow('').max(500).custom(sanitizeString),
    }),
})

export const validatePagination = celebrate({
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().max(100).optional().allow(''),
        sortField: Joi.string().optional().allow(''),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
})

export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required(),
            originalName: Joi.string().required(),
        }),
        category: Joi.string().required().messages({
            'string.empty': 'Поле "category" должно быть заполнено',
        }),
        description: Joi.string().required().messages({
            'string.empty': 'Поле "description" должно быть заполнено',
        }),
        price: Joi.number().allow(null).min(0),
    }),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: Joi.object().keys({
            fileName: Joi.string(),
            originalName: Joi.string(),
        }),
        category: Joi.string(),
        description: Joi.string(),
        price: Joi.number().allow(null).min(0),
    }),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})
