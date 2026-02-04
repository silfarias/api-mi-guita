import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface RequestBody {
  signature?: any;
  polygon?: any;
  base64?: any;
  web_image?: any;
  mobile_image?: any;
  image?: any;
  file?: any;
  attachments?: any;
  attachment?: any;
  [key: string]: any;
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('Logging');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, hostname } = req;
    const reqTime = Date.now();

    res.on('finish', () => {
      const { statusCode, statusMessage } = res;
      const responseTime = Date.now() - reqTime;

      let body: RequestBody = {};
      try {
        if (req.body) {
          body = JSON.parse(JSON.stringify(req.body));
          // Eliminar campos sensibles o grandes
          delete body.signature;
          delete body.polygon;
          delete body.base64;
          delete body.web_image;
          delete body.mobile_image;
          delete body.image;
          delete body.file;
          delete body.attachments;
          delete body.attachment;
        }
      } catch (error) {
        this.logger.warn(`Error al procesar el body de la request: ${error.message}`);
      }

      this.logger.log(
        `👍 LOGGING MIDDLEWARE - Detalles de la solicitud:\n` +
        `IP: ${ip} .\n` +
        `Hostname: ${hostname} .\n` +
        `Method: ${method} .\n` +
        `URL: ${originalUrl} .\n` +
        `Body: ${JSON.stringify(body, null, 2)} .\n` +
        `Response: \n` +
        `  StatusCode: ${statusCode} .\n` +
        `  StatusMessage: ${statusMessage} .\n` +
        `  ResponseTime: ${responseTime}ms .\n`,
      );
    });

    next();
  }
}
