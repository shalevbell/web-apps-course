const { sendError } = require('../utils/responses');

const requireAuth = (req, res, next) => {
  if (req.session?.authenticated && req.session?.user) {
    return next();
  }

  return sendError(res, 'Authentication required', 401);
};

const requireAdmin = (req, res, next) => {
  if (req.session?.authenticated && req.session?.user?.isAdmin) {
    return next();
  }

  return sendError(res, 'Admin privileges required', 403);
};

module.exports = {
  requireAuth,
  requireAdmin
};

