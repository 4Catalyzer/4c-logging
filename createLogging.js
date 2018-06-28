const { inspect } = require('util');
const Env = require('@4c/env');
const isPlainObject = require('lodash/isPlainObject');
const { Container, config, format, transports } = require('winston');

const { combine, colorize, label: addLabel, printf } = format;

function formatValue(arg) {
  if (typeof arg === 'function') {
    return `ƒ() ${arg.name}({...})`;
  }
  if (arg && typeof arg === 'object' && !isPlainObject(arg)) {
    return arg.constructor.name;
  }
  return JSON.stringify(arg) || '';
}

function formatArguments(args) {
  const fullArgs = args.map(formatValue).join(', ');
  return fullArgs.length > 100 ? `${fullArgs.slice(0, 100)}...` : fullArgs;
}

function formatMethod(method, args) {
  return `${method}(${formatArguments(args)})`;
}

module.exports = function createLogging({
  Transport = transports.Console,
} = {}) {
  const container = new Container();
  const TEST = Env.get('NODE_ENV', '') === 'test';
  const useColor = Env.get.boolish('4C_LOGGING_USE_COLOR', true);

  let LEVEL = Env.get('4C_LOGGING_LEVEL', 'info');

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

  function createLogger(id, label = id) {
    container.add(id, {
      level: LEVEL,
      format: defaultFormat(label),
      transports: [new Transport({ silent: TEST })],
    });
    const logger = container.get(id);
    logger.createLogger = createLogger;
    return logger;
  }

  const logger = createLogger('default', null);

  function logify(target, property, desc, level = 'debug') {
    // called with just a level: e.g. logify('info')
    if (arguments.length < 3) return (...args) => logify(...args, target);

    const name = target.name || target.constructor.name;
    const message = `${name}.${property}`;
    const method = desc.value;

    // eslint-disable-next-line no-param-reassign
    desc.value = function $logifiedMethod(...args) {
      const localLogger = this.logger || logger;
      const msg = formatMethod(message, args);

      const logResult = r => localLogger[level](`${msg} => ${formatValue(r)}`);

      localLogger[level](msg);

      const result = method.apply(this, args);

      if (result && typeof result.then === 'function') {
        result.then(logResult, err => {
          localLogger.error(`${msg} => ERROR`, err);
          throw err;
        });
      } else {
        logResult(result);
      }

      return result;
    };
    return desc;
  }

  logger.get = id => container.get(id);

  return {
    logify,
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
};
