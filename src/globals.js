import https from 'https';
import uuid from './uuidv4';

const pkg = require('../package.json');

// Default on module load; changed to false on first handler invocation.
/*eslint-disable import/no-mutable-exports*/
let COLDSTART = true;

const VERSION = pkg.version;
const MODULE_LOAD_TIME = Date.now();
const PROCESS_ID = uuid();

const httpsAgent = new https.Agent({
  maxCachedSessions: 1,
  keepAlive: true
});

httpsAgent.originalCreateConnection = httpsAgent.createConnection;
httpsAgent.createConnection = (port, host, options) => {
  /* noDelay is documented as defaulting to true, but docs lie.
     this sacrifices throughput for latency and should be faster
     for how we submit data. */
  const socket = httpsAgent.originalCreateConnection(port, host, options);
  socket.setNoDelay(true);
  return socket;
};

function resetColdstart(bool = false) {
  COLDSTART = bool;
}

export {
  VERSION,
  MODULE_LOAD_TIME,
  PROCESS_ID,
  COLDSTART,
  httpsAgent,
  resetColdstart
};
