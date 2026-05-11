const REMOTE_IMAGE_URL_PATTERN = /^(https?:)?\/\//i;

export const shouldBypassImageOptimization = (src) => {
  if (typeof src !== "string") return false;

  const normalizedSrc = src.trim();
  if (!normalizedSrc) return false;

  if (normalizedSrc.startsWith("data:") || normalizedSrc.startsWith("blob:")) {
    return true;
  }

  // Avoid proxying remote and presigned media through the Next.js image
  // optimizer. These URLs are often large, expiring, or signed, and can put
  // unnecessary load on the frontend dyno.
  return REMOTE_IMAGE_URL_PATTERN.test(normalizedSrc);
};
