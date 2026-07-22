export async function shareOrCopy(data: { title: string; text: string; url?: string }): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch {
      // user cancelled the share sheet — not an error worth surfacing
      return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText([data.text, data.url].filter(Boolean).join('\n'));
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function shareImage(canvas: HTMLCanvasElement, filename: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return 'failed';
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'CricDuel result' });
      return 'shared';
    } catch {
      return 'failed';
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
