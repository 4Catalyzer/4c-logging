describe('logging', () => {
  const $console = global.console;
  let logging;
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.fn();
    errorSpy = jest.fn();

    global.console = { log: logSpy, error: errorSpy };

    // turn off color for easier asserts
    process.env['4C_LOGGING_USE_COLOR'] = false;

    delete process.env.NODE_ENV;
    logging = require('../index');
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    global.console = $console;
  });

  it('should log', () => {
    logging.logger.info('foo');

    expect(logSpy).toHaveBeenCalledWith('info:  foo');
  });

  it('should set level', () => {
    logging.logger.debug('foo');
    const fooLogger = logging.logger.createLogger('foo');

    fooLogger.debug('foo');

    expect(logSpy).not.toHaveBeenCalled();

    logging.setLevel('debug');

    logging.logger.debug('foo');
    expect(logSpy).toHaveBeenCalledWith('debug:  foo');
    fooLogger.debug('foo');
    expect(logSpy).toHaveBeenCalledWith('debug:  foo');
  });

  it('should add loggers', () => {
    logging.logger.createLogger('socket', 'Socket.IO').info('foo');

    expect(logSpy).toHaveBeenCalledWith('info:  [Socket.IO] foo');
  });

  it('sub loggers should be able to add new loggers', () => {
    logging.logger
      .createLogger('foo')
      .createLogger('bar')
      .info('foo');

    expect(logSpy).toHaveBeenCalledWith('info:  [bar] foo');
  });
});
