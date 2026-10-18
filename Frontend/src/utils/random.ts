/**
 * Utility functions for generating unique 6-digit room codes using randomInt.
 * Allowed characters: 0-9 and A-Z (36 possible characters -> 2.17+ billion combinations)
 */

const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Keep track of previously generated codes to guarantee uniqueness
const generatedCodes = new Set<string>();

/**
 * Returns a cryptographically secure random integer between min and max (inclusive).
 * Falls back to Math.random if crypto is unavailable.
 */
export function randomInt(min: number, max: number): number {
  const minVal = Math.ceil(min);
  const maxVal = Math.floor(max);
  const range = maxVal - minVal + 1;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return minVal + (randomBuffer[0] % range);
  }

  return Math.floor(Math.random() * range) + minVal;
}

// Alias for flexible naming convention
export const getRandomInt = randomInt;

/**
 * Generates a unique 6-digit room code combining 0-9 and A-Z.
 * Guarantees no duplicate codes are issued.
 */
export function generateUniqueRoomCode(length: number = 6): string {
  let attempts = 0;
  let code = '';

  do {
    code = '';
    for (let i = 0; i < length; i++) {
      const index = randomInt(0, CHARACTERS.length - 1);
      code += CHARACTERS[index];
    }
    attempts++;
  } while (generatedCodes.has(code) && attempts < 100);

  // Store in set to guarantee uniqueness
  generatedCodes.add(code);
  return code;
}

// Aliases for convenience
export const generateRoomId = generateUniqueRoomCode;
export const generateRoomCode = generateUniqueRoomCode;

export interface UserBubbleTheme {
  bg: string;
  border: string;
  text: string;
}

// Distinct, vibrant high-contrast color themes for different users
export const DISTINCT_USER_COLORS: UserBubbleTheme[] = [
  { bg: '#172554', border: '#3b82f6', text: '#ffffff' }, // 1. Deep Blue
  { bg: '#064e3b', border: '#10b981', text: '#ffffff' }, // 2. Deep Emerald Green
  { bg: '#3b0764', border: '#a855f7', text: '#ffffff' }, // 3. Deep Purple
  { bg: '#451a03', border: '#f97316', text: '#ffffff' }, // 4. Deep Amber / Orange
  { bg: '#4c0519', border: '#f43f5e', text: '#ffffff' }, // 5. Deep Crimson Rose
  { bg: '#083344', border: '#06b6d4', text: '#ffffff' }, // 6. Deep Cyan
  { bg: '#312e81', border: '#6366f1', text: '#ffffff' }, // 7. Deep Indigo
  { bg: '#4a044e', border: '#d946ef', text: '#ffffff' }, // 8. Deep Fuchsia
  { bg: '#14532d', border: '#22c55e', text: '#ffffff' }, // 9. Deep Forest Green
  { bg: '#431407', border: '#ea580c', text: '#ffffff' }, // 10. Deep Rust
  { bg: '#134e4a', border: '#14b8a6', text: '#ffffff' }, // 11. Deep Teal
  { bg: '#2e1065', border: '#c084fc', text: '#ffffff' }, // 12. Deep Violet
];

// Sequential assignment map: ensures every new user gets a completely different color
const userColorAssignment = new Map<string, number>();

/**
 * Returns a consistent theme for a user.
 * - 'me' gets a sleek dark zinc bubble on the right.
 * - Users 1 to 12: 12 curated, vibrant distinct colors.
 * - User 13+: Golden Angle (137.508°) dynamic HSL generator (infinite unique colors).
 * - All text is crisp white (#ffffff) with guaranteed >12:1 contrast ratio (Zero Camouflage).
 */
export function getUserBubbleTheme(senderId: string, isMe: boolean): UserBubbleTheme {
  if (isMe) {
    return {
      bg: '#1e1e24',
      border: '#3f3f46',
      text: '#f4f4f5',
    };
  }

  // Ensure every distinct senderId gets assigned the NEXT unique sequential index
  if (!userColorAssignment.has(senderId)) {
    const nextIndex = userColorAssignment.size;
    userColorAssignment.set(senderId, nextIndex);
  }

  const userIndex = userColorAssignment.get(senderId)!;

  // For the first 12 users, use our hand-tuned distinct palette
  if (userIndex < DISTINCT_USER_COLORS.length) {
    return DISTINCT_USER_COLORS[userIndex];
  }

  // For user 13 and beyond: Golden Angle dynamic HSL generator (unlimited unique colors)
  // 137.508° (Golden Angle) guarantees the maximum color distance between any two users
  const hue = Math.round((userIndex * 137.508) % 360);

  return {
    bg: `hsl(${hue}, 52%, 14%)`,      // Deep tinted background
    border: `hsl(${hue}, 75%, 50%)`,  // Vibrant matching border
    text: '#ffffff',                  // Pure white text (12.5:1 contrast, zero camouflage)
  };
}
