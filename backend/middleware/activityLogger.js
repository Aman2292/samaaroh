const ActivityLog = require('../models/ActivityLog');

const activityLogger = async (req, res, next) => {
  // Only log state-changing methods
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original end function to intercept response
  const originalEnd = res.end;
  
  res.end = function (chunk, encoding) {
    // Restore original end
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Log after response is sent
    // Only log successful operations (2xx codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logActivity(req).catch(err => console.error('Activity Logging Error:', err));
    }
  };

  next();
};

const logActivity = async (req) => {
  if (!req.user) return; // Skip if not authenticated

  try {
    const logData = {
      userId: req.user._id,
      userRole: req.user.role,
      action: determineAction(req),
      targetType: determineTargetType(req),
      targetId: req.params.id || null, // Best guess for ID
      targetName: req.body.name || req.body.title || 'Unknown', // Best guess for name
      details: {
        method: req.method,
        url: req.originalUrl,
        body: sanitizeBody(req.body),
        query: req.query,
        params: req.params
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      organizationId: req.user.organizationId
    };

    await ActivityLog.create(logData);
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};

const determineAction = (req) => {
  const method = req.method;
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return 'UNKNOWN';
};

const determineTargetType = (req) => {
  // Extract resource from URL (e.g., /api/events -> EVENT)
  const pathParts = req.originalUrl.split('/');
  // Usually the resource is the second part after /api/
  // /api/events/:id -> events
  // /api/auth/login -> auth
  
  // Find the part after 'api'
  const apiIndex = pathParts.indexOf('api');
  if (apiIndex !== -1 && pathParts[apiIndex + 1]) {
    let resource = pathParts[apiIndex + 1];
    // Remove query params if any
    resource = resource.split('?')[0];
    
    // Map common resources to singular uppercase
    const map = {
      'events': 'EVENT',
      'guests': 'GUEST',
      'tasks': 'TASK',
      'users': 'USER',
      'clients': 'CLIENT',
      'payments': 'PAYMENT',
      'notifications': 'NOTIFICATION',
      'teams': 'TEAM',
      'auth': 'AUTH'
    };
    
    return map[resource] || resource.toUpperCase();
  }
  
  return 'UNKNOWN';
};

const sanitizeBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
};

module.exports = activityLogger;
