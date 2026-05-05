/**
 * Web Share API with clipboard fallback.
 */
export async function shareOrCopy(options: {
  title?: string;
  text: string;
  url?: string;
}): Promise<'shared' | 'copied' | false> {
  const url = options.url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const text = options.text.trim();

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text,
        url,
      });
      return 'shared';
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === 'AbortError') return false;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    const payload = [text, url].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(payload);
    return 'copied';
  }

  return false;
}
