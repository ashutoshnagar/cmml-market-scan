// Main API entry point
module.exports = (req, res) => {
  res.status(200).json({
    message: 'CMML Market Scan API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};
