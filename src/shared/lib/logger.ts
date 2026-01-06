const shouldLog = import.meta.env.DEV;

export const logError = (message: string, error?: unknown) => {
  if (!shouldLog) return;
  if (error !== undefined) {
    console.error(message, error);
    return;
  }
  console.error(message);
};

export const logWarn = (message: string, error?: unknown) => {
  if (!shouldLog) return;
  if (error !== undefined) {
    console.warn(message, error);
    return;
  }
  console.warn(message);
};
