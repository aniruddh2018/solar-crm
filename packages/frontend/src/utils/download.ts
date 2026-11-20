export function downloadBlob(data: BlobPart, filename: string, mimeType = 'application/pdf'): void {
  const blob = data instanceof Blob && data.type ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.replace(/[^a-z0-9._-]+/gi, '-');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
