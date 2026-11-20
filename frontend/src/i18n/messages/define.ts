/** Same keys as T, every leaf a string. */
export type Shape<T> = {
  [K in keyof T]: T[K] extends string ? string : Shape<T[K]>;
};

/**
 * Declares one area's messages in both languages side by side.
 * The Bangla object must have exactly the English keys, so a missing or
 * misspelled translation is a compile error, not a blank on screen.
 */
export function defineMessages<T extends object>(messages: { en: T; bn: Shape<T> }) {
  return messages;
}
