// utils/logger.ts

const isProd = process.env.EXPO_PUBLIC_ENV === 'production';

export function log(...args: any[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function warn(...args: any[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

export function error(...args: any[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

export default { log, warn, error };
