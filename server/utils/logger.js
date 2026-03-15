function serializeError(error) {
  if (!error) return undefined;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

function createLog(level, message, context = {}) {
  return {
    ts: new Date().toISOString(),
    level,
    message,
    ...context
  };
}

function write(level, message, context) {
  const payload = createLog(level, message, context);
  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message, context = {}) {
    write('info', message, context);
  },
  warn(message, context = {}) {
    write('warn', message, context);
  },
  error(message, context = {}) {
    const next = { ...context };
    if (context.error instanceof Error) {
      next.error = serializeError(context.error);
    }
    write('error', message, next);
  }
};
