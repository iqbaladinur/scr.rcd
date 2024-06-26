import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts bytes to an appropriate unit (KB or MB) based on the size.
 * @param {number} bytes - The number of bytes.
 * @returns {string} - The converted value with the appropriate unit.
 */
export function convertBytesAdaptive(bytes: number): string {
  if (bytes < 1024) {
      return `${bytes} Bytes`;
  } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
