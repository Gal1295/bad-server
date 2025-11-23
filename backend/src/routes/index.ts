import { Router } from 'express'
import authRouter from './auth'
import customerRouter from './customers'
import orderRouter from './order'
import productRouter from './product'
import uploadRouter from './upload'
import auth from '../middlewares/auth'
import { adminGuard } from '../middlewares/auth'
import NotFoundError from '../errors/not-found-error'

const router = Router()

// Диагностические маршруты
router.get('/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
        status: 'OK',
        service: 'backend', 
        timestamp: new Date(),
        routes: ['/auth', '/orders', '/upload', '/customers', '/product']
    });
});

// Основные роуты
router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/orders', auth, adminGuard, orderRouter)  // ✅ Только админы
router.use('/customers', auth, adminGuard, customerRouter)  // ✅ Только админы
router.use('/upload', auth, uploadRouter)

// ✅ ДОБАВИМ РОУТ ДЛЯ ТЕСТА УЯЗВИМОСТИ ТЕЛЕФОНА
router.post('/test-phone-validation', (req, res) => {
    const { phone } = req.body;
    
    // ✅ Простая валидация телефона как в createOrder
    const cleanedPhone = phone ? String(phone).replace(/[^\d+]/g, '') : '';
    if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 15 || !/^\+?\d+$/.test(cleanedPhone)) {
        return res.status(400).json({
            success: false,
            message: 'Некорректный номер телефона'
        });
    }
    
    res.json({ success: true, phone: cleanedPhone });
});

// Обработка 404
router.use('*', (req, res, next) => {
    console.log('❌ 404 - Маршрут не найден:', req.method, req.originalUrl);
    next(new NotFoundError('Маршрут не найден'))
})

export default router
