const { logger, setLevel } = require('../index');

setLevel('debug');

logger.info('foo asfasfasfasf');
logger.add('socket', 'Socket.IO').info('foo asfasfasfasf');
