export function generateInvoiceNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(4, '0')}`;
}

export function excludePassword(user: any): any {
  const { password_hash, refresh_token, ...rest } = user;
  return rest;
}
