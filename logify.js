const isPlainObject = require('lodash/isPlainObject');
const { logger: _logger } = require('./index');

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

module.exports = function logify(target, property, desc, level = 'debug') {
  // called with just a level: e.g. logify('info')
  if (arguments.length < 3) return (...args) => logify(...args, target);

  const name = target.name || target.constructor.name;
  const message = `${name}.${property}`;
  const method = desc.value;

  // eslint-disable-next-line no-param-reassign
  desc.value = function $logifiedMethod(...args) {
    const logger = this.logger || _logger;
    const msg = formatMethod(message, args);

    const logResult = r => logger[level](`${msg} => ${formatValue(r)}`);

    logger[level](msg);

    const result = method.apply(this, args);

    if (result && typeof result.then === 'function') {
      result.then(logResult, err => {
        logger.error(`${msg} => ERROR`, err);
        throw err;
      });
    } else {
      logResult(result);
    }

    return result;
  };
  return desc;
};
