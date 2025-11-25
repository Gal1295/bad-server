import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const normalizedPath = path.normalize(req.path)
        const filePath = path.join(baseDir, normalizedPath)
        const resolvedBaseDir = path.resolve(baseDir)
        const resolvedFilePath = path.resolve(filePath)
        
        if (!resolvedFilePath.startsWith(resolvedBaseDir)) {
            return next()
        }

        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return next()
            }
            // Файл существует, отправляем его клиенту
            return res.sendFile(filePath, (err) => {
                if (err) {
                    next(err)
                }
            })
        })
    }
}
