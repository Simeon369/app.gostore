const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * INVITE_ALPHABET.length);
    result += INVITE_ALPHABET[index];
  }
  return result;
}

export function generateInviteCode(): string {
  return `GST-${randomSegment(4)}-${randomSegment(2)}`;
}

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase();
}
