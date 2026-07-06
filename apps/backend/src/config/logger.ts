import pino from 'pino';
import { env } from './env.js';

const pinoConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.passwordConfirmation'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    }),
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
};

if (env.isDevelopment && env.LOG_PRETTY) {
  pinoConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(pinoConfig);
