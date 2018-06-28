const { transports } = require('winston');
const { ipcRenderer, ipcMain } = require('electron'); // eslint-disable-line

let registered = false;

class ElectronTransport extends transports.Console {
  static registerMainProcess(logger) {
    if (!ipcMain || registered) return;

    registered = true;
    ipcMain.on('__4C_LOGGING_LOG_RENDERER__', (_, info) => {
      // Symbols don't survive cross-realm
      /* eslint-disable no-param-reassign */
      info[Symbol.for('level')] = info.level;
      info[Symbol.for('message')] = info.message;
      /* eslint-enable no-param-reassign */

      logger.transports.forEach(transport => transport.log(info));
    });
  }

  constructor(...args) {
    super(...args);

    this.isRenderer = process.type === 'renderer';
  }

  log(info, ...args) {
    if (this.isRenderer) {
      const data = { ...info };
      // Symbols don't survive cross-realm
      data.level = info[Symbol.for('level')];
      data.message = info[Symbol.for('message')];

      ipcRenderer.send('__4C_LOGGING_LOG_RENDERER__', data);
    }
    return super.log(info, ...args);
  }
}

module.exports = ElectronTransport;
