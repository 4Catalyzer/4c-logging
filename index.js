const winston = require('winston');

winston.cli();

const config = winston.config;

const formatter = i =>
  `${config.colorize(i.level, i.level)}:\t (${i.label}) ` +
  `${i.message} ${i.meta ? `\t${JSON.stringify(i.meta, null, 2)}` : ''}`;

// Disable logging for tests
if (process.env.NODE_ENV === 'test') {
  winston.configure({ transports: [] });

  Object.values(winston.loggers.loggers).forEach(l => {
    l.configure({
      transports: [],
    });
  });
}

module.exports = {
  config,
  formatter,
  add(name, label = name) {
    winston.loggers.add(name, {
      console: { label, formatter },
    });
  },
  get(name) {
    return winston.loggers.get(name);
  },
  logger: winston,
};
