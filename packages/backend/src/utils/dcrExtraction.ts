import fs from 'fs/promises';
// pdf-parse v1 is CommonJS and does not publish TypeScript declarations.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export function findDcrNumber(text: string): string | null {
  const normalized = text.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ');
  const patterns = [
    /DCR\s*(?:CERTIFICATE|CERTIFICATION)?\s*(?:NO\.?|NUMBER)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})/i,
    /(?:CERTIFICATE|REGISTRATION)\s*(?:NO\.?|NUMBER)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})/i,
    /ALMM\s*(?:REGISTRATION)?\s*(?:NO\.?|NUMBER)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})/i,
  ];
  for (const pattern of patterns) { const match = normalized.match(pattern); if (match) return match[1].replace(/[.,;]+$/, '').toUpperCase(); }
  return null;
}

export async function extractDcrCertificate(filePath: string, mimeType: string): Promise<{ text: string; dcrNumber: string | null }> {
  const buffer = await fs.readFile(filePath); let text = '';
  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) text = (await pdfParse(buffer)).text || '';
  else if (mimeType.startsWith('text/')) text = buffer.toString('utf8');
  return { text: text.slice(0, 100_000), dcrNumber: findDcrNumber(text) };
}
