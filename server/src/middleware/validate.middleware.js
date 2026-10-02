import { ZodError } from "zod";

/**
 * Zod validation middleware factory.
 * Accepts an object { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsed = await schema.query.parseAsync(req.query);
        if (req.query && typeof req.query === "object") {
          for (const k of Object.keys(req.query)) {
            delete req.query[k];
          }
          Object.assign(req.query, parsed);
        }
      }
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return res.status(400).json({
          success: false,
          message: "Input validation failed",
          errors: issues,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid request payload",
      });
    }
  };
}
