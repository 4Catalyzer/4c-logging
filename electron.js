const ElectronTransport = require('./transports/electron');
const createLogging = require('./createLogging');

module.exports = createLogging({
  Transport: ElectronTransport,
});

ElectronTransport.registerMainProcess(module.exports.logger);
