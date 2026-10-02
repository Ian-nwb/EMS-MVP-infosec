/**
 * Deep sanitization function that removes any keys starting with '$' or containing '.'
 * Works cleanly with Express 5 where req.query has only a getter.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeObject(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      console.warn(`[Security Alert] Sanitized suspicious key '${key}' in request payload`);
      delete obj[key];
    } else {
      obj[key] = sanitizeObject(obj[key]);
    }
  }

  return obj;
}

export function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  next();
}
