const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Admin = require('../models/Admin');

// Protect routes — verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'लगइन गर्नुहोस्' }); // Please login
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in the appropriate collection based on role
    if (decoded.role === 'patient') {
      req.user = await User.findById(decoded.id);
    } else if (decoded.role === 'provider') {
      req.user = await Provider.findById(decoded.id);
    } else if (decoded.role === 'admin' || decoded.role === 'superadmin' || decoded.role === 'dispatcher') {
      req.user = await Admin.findById(decoded.id);
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'प्रयोगकर्ता फेला परेन' }); // User not found
    }

    req.user.role = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'अमान्य टोकन' }); // Invalid token
  }
};

// Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'तपाईंलाई यो पहुँच छैन' // You don't have access
      });
    }
    next();
  };
};

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = { protect, authorize, generateToken };
