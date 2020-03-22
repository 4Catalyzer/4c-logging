const createLogging = require('./createLogging');
const ElectronTransport = require('./transports/electron');

module.exports = createLogging({
  Transport: ElectronTransport,
});

ElectronTransport.registerMainProcess(module.exports.logger);
