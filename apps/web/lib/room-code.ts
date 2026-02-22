// Base32 character set without I, O, 1, 0 for clarity
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * Validate that a room code contains only valid characters
 */
export function isValidRoomCode(code: string): boolean {
  return (
    code.length === CODE_LENGTH &&
    [...code].every((char) => CHARS.includes(char))
  );
}

/**
 * Format room code for display (add spaces for readability)
 */
export function formatRoomCode(code: string): string {
  if (code.length !== CODE_LENGTH) {
    return code;
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Parse formatted room code back to original
 */
export function parseRoomCode(formatted: string): string {
  return formatted.replace(/-/g, '').toUpperCase();
}

/**
 * Generate room URL
 */
export function generateRoomUrl(appUrl: string, roomCode: string): string {
  return `${appUrl}/join/${roomCode}`;
}
