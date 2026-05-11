import db from '../db';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';

export interface AuditRecord {
  userId?: number | null;
  userEmail?: string | null;
  action: string; // e.g. 'admin.route.create'
  entity: string; // e.g. 'route'
  entityId?: string | number | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Persist a single audit record. Swallows internal errors so a logging
 * failure never breaks a successful API call.
 */
export function recordAudit(rec: AuditRecord): void {
  try {
    db.prepare(
      `INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, meta, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      rec.userId ?? null,
      rec.userEmail ?? null,
      rec.action,
      rec.entity,
      rec.entityId != null ? String(rec.entityId) : null,
      rec.meta ? JSON.stringify(rec.meta) : null,
      rec.ip ?? null,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to record entry', err);
  }
}

/**
 * Express middleware factory: records an audit log after the response is
 * sent (only for 2xx responses). Use on admin mutation routes where the
 * specific (action, entity) is known at wire-up time.
 */
export function auditMiddleware(action: string, entity: string) {
  return function (req: AuthRequest, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const userEmail = req.userId
        ? ((db
            .prepare('SELECT email FROM users WHERE id = ?')
            .get(req.userId) as { email: string } | undefined)?.email ?? null)
        : null;
      recordAudit({
        userId: req.userId ?? null,
        userEmail,
        action,
        entity,
        entityId: (req.params.id as string | undefined) ?? null,
        meta: {
          method: req.method,
          path: req.originalUrl,
          // Only persist a shallow copy of body keys to avoid leaking large blobs.
          bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : undefined,
        },
        ip: ((req.ip ||
          (Array.isArray(req.headers['x-forwarded-for'])
            ? req.headers['x-forwarded-for'][0]
            : req.headers['x-forwarded-for']) ||
          null) as string | null),
      });
    });
    next();
  };
}
