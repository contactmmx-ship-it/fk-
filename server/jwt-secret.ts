const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Read the JWT signing secret without a hardcoded fallback.
 * A missing or weak value disables authentication rather than signing
 * sessions with a publicly known key.
 */
export function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) return null;
  return secret;
}
