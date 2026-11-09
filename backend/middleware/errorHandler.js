const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('❌ Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'अमान्य ID' // Invalid ID
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `यो ${field} पहिले नै दर्ता भइसकेको छ` // This field is already registered
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Body too large (e.g. oversized visit-report photos)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'फाइल धेरै ठूलो छ' }); // File too large
  }

  const status = error.statusCode || 500;
  // Don't leak internal error details (stack-ish messages, DB errors) to clients in production.
  const hide = status >= 500 && process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    message: hide ? 'सर्भर त्रुटि' : (error.message || 'सर्भर त्रुटि') // Server error
  });
};

module.exports = errorHandler;
