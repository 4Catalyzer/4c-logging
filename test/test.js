const { logger, level, add } = require('../index');

level('debug');

logger.info('foo asfasfasfasf');
add('socket', 'Socket.IO').info('foo asfasfasfasf');
