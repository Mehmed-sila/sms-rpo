function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
