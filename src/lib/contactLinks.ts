/** "@handle" from an Instagram profile URL (falls back to the URL itself). */
export function instagramHandle(url: string): string {
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : url;
}

/** tel: href from a display phone number (assumes US if no country code). */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  return `tel:${digits.length === 10 ? `+1${digits}` : digits}`;
}
