export const success = (res, data = null, message = "OK", statusCode = 200) =>
  res.status(statusCode).json({ status: "success", message, data });

export const created = (res, data, message = "Created") =>
  success(res, data, message, 201);

export const error = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errors = null,
) => {
  const body = { status: "error", message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
