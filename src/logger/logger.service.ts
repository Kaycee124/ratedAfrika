import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class customLoggerClass implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info', // Log info, warn, and error messages
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Include stack traces
        winston.format.json(), // JSON format for easier parsing
      ),
      transports: [
        // Console output (colored for readability)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, stack }) => {
              const contextStr = context ? `[${context}]` : '';
              return `${timestamp} ${level} ${contextStr} ${message}${stack ? '\n' + stack : ''}`;
            }),
          ),
        }),
        
        // ERROR logs only
        new winston.transports.File({ 
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.json(),
        }),
        
        // ALL logs (info, warn, error)
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.json(),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
