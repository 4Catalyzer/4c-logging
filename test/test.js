const { logger, setLevel } = require('../index');

setLevel('debug');

logger.info('foo asfasfasfasf');
logger.debug('foo');

logger.add('socket', 'Socket.IO').info('foo asfasfasfasf');

logger
  .add('Bar')
  .add('Foo')
  .info('foo asfasfasfasf');
