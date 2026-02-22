// Base32 character set without I, O, 1, 0 for clarity
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * Generate a random 6-character room code using Base32 (excluding I, O, 1, 0)
 * Approximately 1 billion possible combinations (32^6)
 */
export function generateRoomCode(): string {
  let code = '';
  const randomValues = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[randomValues[i] % CHARS.length];
  }

  return code;
}

/**
 * Validate that a room code contains only valid characters
 */
export function isValidRoomCode(code: string): boolean {
  return (
    code.length === CODE_LENGTH &&
    [...code].every((char) => CHARS.includes(char))
  );
}
