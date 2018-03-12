const omit = require('lodash/omit');
const { Container, config, format, transports } = require('winston');

const { combine, colorize, label: addLabel, printf } = format;

const container = new Container();
const TEST = process.env.NODE_ENV === 'test';

let LEVEL = 'info';

const appendMeta = format(i => {
  const meta = omit(i, ['level', 'message', 'label']);
  if (!Object.keys(meta).length) return i;
  i.message = `${i.message}\t${JSON.stringify(meta, null, 2)}`; // eslint-disable-line
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

function add(id, label = id) {
  container.add(id, {
    level: LEVEL,
    format: combine(
      ...[
        colorize(),
        label && addLabel({ label, message: true }),
        appendMeta(),
        printf(i => `${i.level}:  ${i.message}`),
      ].filter(Boolean),
    ),
    transports: [new ConsoleTransport({ silent: TEST })],
  });
  return container.get(id);
}

module.exports = {
  config,
  add,
  get: name => container.get(name),
  level(level) {
    LEVEL = level;
    Object.values(container.loggers).forEach(l => {
      l.level = level; // eslint-disable-line
    });
  },

  logger: add('default', null),
};
