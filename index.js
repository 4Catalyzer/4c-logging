const { inspect } = require('util');
const { Container, config, format, transports } = require('winston');

const { combine, colorize, label: addLabel, printf } = format;

const container = new Container();
const TEST = process.env.NODE_ENV === 'test';

let LEVEL = 'info';

const appendMeta = format(i => {
  const { level: _, message: _a, label: _b, ...meta } = i;
  delete meta[Symbol.for('level')];

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

class ConsoleTransport extends transports.Console {
  constructor(opts) {
    super(opts);
    this.silent = opts.silent;
  }
  log(...args) {
    if (this.silent) return;
    super.log(...args);
  }
}

const defaultFormat = label =>
  combine(
    ...[
      colorize(),
      label && addLabel({ label, message: true }),
      appendMeta(),
      printf(i => `${i.level}:  ${i.message}`),
    ].filter(Boolean),
  );

function add(id, label = id) {
  container.add(id, {
    level: LEVEL,
    format: defaultFormat(label),
    transports: [new ConsoleTransport({ silent: TEST })],
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
    Object.values(container.loggers).forEach(l => {
      l.level = level; // eslint-disable-line
    });
  },
};
