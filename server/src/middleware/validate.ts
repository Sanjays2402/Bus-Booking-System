import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const err = result.error as ZodError;
      const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    // Replace with parsed/cleaned data
    (req as any)[source] = result.data;
    next();
  };
}
