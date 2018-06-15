const { inspect } = require('util');
const Env = require('@4c/env');
const { Container, config, format, transports } = require('winston');

const { combine, colorize, label: addLabel, printf } = format;

const container = new Container();
const TEST = Env.get('NODE_ENV', '') === 'test';
const useColor = Env.get.boolish('4C_LOGGING_USE_COLOR', true);

let LEVEL = 'info';

const appendMeta = format(i => {
  const { level: _, message: _a, label: _b, ...meta } = i;
  // remove winston symbols
  delete meta[Symbol.for('level')];
  delete meta[Symbol.for('splat')];

  if (!Object.keys(meta).length) return i;
  // eslint-disable-next-line
  i.message = `${i.message}:\t${inspect(meta, {
    showProxy: true,
    depth: 2,
    maxArrayLength: 5,
    colors: true,
  })}`;
  return i;
});

const defaultFormat = label =>
  combine(
    ...[
      useColor && colorize(),
      label && addLabel({ label, message: true }),
      appendMeta(),
      printf(i => `${i.level}:  ${i.message}`),
    ].filter(Boolean),
  );

function add(id, label = id) {
  container.add(id, {
    level: LEVEL,
    format: defaultFormat(label),
    transports: [new transports.Console({ silent: TEST })],
  });
  const logger = container.get(id);
  logger.add = add;
  return logger;
}

const logger = add('default', null);

logger.get = id => container.get(id);

module.exports = {
  logger,
  config,
  format,
  transports,
  container,
  setLevel(level) {
    LEVEL = level;

    for (const l of container.loggers.values()) {
      l.level = level;
    }
  },
};
