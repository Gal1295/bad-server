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

        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
            if (accessErr) {
                return next()
            }
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    next(sendErr)
                }
            })
        })
    }
}
