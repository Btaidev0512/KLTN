// Middleware to track and log concurrent requests
let activeRequests = 0;
let requestsPerTab = new Map();

const requestTracker = (req, res, next) => {
  activeRequests++;
  
  // Track per tab if tab-id header is present
  const tabId = req.headers['x-tab-id'];
  if (tabId) {
    requestsPerTab.set(tabId, (requestsPerTab.get(tabId) || 0) + 1);
  }
  
  // Log high concurrent load
  if (activeRequests > 20) {
    console.warn(`⚠️ High concurrent requests: ${activeRequests} active`);
  }
  
  // Cleanup on response finish
  res.on('finish', () => {
    activeRequests--;
    if (tabId && requestsPerTab.has(tabId)) {
      const count = requestsPerTab.get(tabId) - 1;
      if (count <= 0) {
        requestsPerTab.delete(tabId);
      } else {
        requestsPerTab.set(tabId, count);
      }
    }
  });
  
  next();
};

// Get current stats
const getStats = () => ({
  activeRequests,
  requestsPerTab: Object.fromEntries(requestsPerTab)
});

module.exports = {
  requestTracker,
  getStats
};
