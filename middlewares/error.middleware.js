const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = err.name === "MulterError" ? 400 : err.statusCode || err.status || 500;

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Server Error" : err.message,
  });
};

export default errorMiddleware;
