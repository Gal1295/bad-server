import { Router } from 'express'
import authRouter from './auth'
import customerRouter from './customers'
import orderRouter from './order'
import productRouter from './product'
import uploadRouter from './upload'
import auth from '../middlewares/auth'
import NotFoundError from '../errors/not-found-error'

const router = Router()

// ✅ ДЕТАЛЬНАЯ ДИАГНОСТИКА КАЖДОГО ЗАПРОСА
router.use((req, res, next) => {
    console.log('=== 🎯 ROUTER DIAGNOSTICS ===');
    console.log('🎯 Method:', req.method);
    console.log('🎯 Path:', req.path);
    console.log('🎯 Original URL:', req.originalUrl);
    console.log('🎯 Base URL:', req.baseUrl);
    console.log('🎯 Query:', req.query);
    console.log('=== 🎯 END DIAGNOSTICS ===');
    next();
});

// Диагностические маршруты
router.get('/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
        status: 'OK',
        service: 'backend', 
        timestamp: new Date(),
        routes: ['/auth', '/order', '/upload', '/customers', '/product']
    });
});

// Основные роуты - ВЕРНЕМ ОРИГИНАЛЬНЫЕ ПУТИ
router.use('/auth', authRouter)
router.use('/product', productRouter)
router.use('/order', auth, orderRouter)  // ✅ ОРИГИНАЛЬНЫЙ ПУТЬ /order
router.use('/customers', auth, customerRouter)
router.use('/upload', auth, uploadRouter)

// Обработка 404
router.use('*', (req, res, next) => {
    console.log('❌ 404 - Маршрут не найден. Доступные пути:');
    console.log('❌ Method:', req.method);
    console.log('❌ Path:', req.path);
    console.log('❌ Original URL:', req.originalUrl);
    next(new NotFoundError('Маршрут не найден'))
})

export default router
