import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, part: RequestPart = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[part];
      const parsed = schema.parse(data);
      req[part] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
};
