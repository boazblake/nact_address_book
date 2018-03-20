const {spawnStateless} = require('nact');


const logLevelAsText = (level) => {
  switch(level){
    case LogLevel.OFF: return 'OFF';
    case LogLevel.TRACE: return 'TRACE';
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
  	case LogLevel.CRITICAL: return 'CRITICAL'
    default: return '???';
  }
};

const getLogText = (msg) => {
  let path = msg.actor
  switch(msg.type) {
    case 'trace':
      let level = logLevelAsText(msg.level);
      return `[${level}, ${msg.actor.path}, ${msg.createdAt}]: ${JSON.stringify(msg.message)}`;
    case 'event':
      return `[EVENT, ${msg.actor.path}, ${msg.createdAt}]: {'${msg.name}': ${JSON.stringify(msg.properties)}}`;
    case 'exception':
      return `[EXCEPTION, ${msg.actor.path}, ${msg.createdAt}]: ${JSON.stringify(msg.exception)}`;
    case 'metric':
      return `[METRIC, ${msg.actor.path}, ${msg.createdAt}]: {'${msg.name}': ${JSON.stringify(msg.properties)}}`;
    default:
      return `[???, ${msg.actor.path} ${msg.createdAt}]: ${JSON.stringify(msg)}`;
  }
};

const consoleLogger = (system) =>
  spawnStateless(
    system,
    (msg, _) => {
      let text = getLogText(msg);
      console.log(text);
    },
    "console-logger"
  );


  module.exports = {
    consoleLogger}