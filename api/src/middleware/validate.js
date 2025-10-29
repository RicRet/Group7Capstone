// schema is a zod object with optional shape: { body, query, params }
export const validate = (schema) => async (req, _res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (e) {
    next(e);
  }
};
