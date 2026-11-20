import path from 'path';
import type { Response } from 'express';

export function safeDocumentName(parts: Array<string | null | undefined>, originalName: string): string {
  const extension = path.extname(originalName); const base = path.basename(originalName, extension);
  return [...parts, base].filter(Boolean).join('-').replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-') + extension.toLowerCase();
}

export function sendStoredDocument(res: Response, filePath: string, filename: string, disposition: 'inline' | 'attachment', mimeType?: string | null): void {
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  if (mimeType) res.setHeader('Content-Type', mimeType);
  res.sendFile(path.resolve(filePath));
}
