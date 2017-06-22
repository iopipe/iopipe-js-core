const pkg = require('../package.json');
const uuid = require('./uuidv4');
const https = require('https');

const VERSION = pkg.version;
const MODULE_LOAD_TIME = Date.now();
const PROCESS_ID = uuid();
// Default on module load; changed to false on first handler invocation.
let COLDSTART = true;

const httpsAgent = new https.Agent({
  maxCachedSessions: 1,
  keepAlive: true
});

httpsAgent.originalCreateConnection = httpsAgent.createConnection;
httpsAgent.createConnection = (port, host, options) => {
  /* noDelay is documented as defaulting to true, but docs lie.
     this sacrifices throughput for latency and should be faster
     for how we submit data. */
  let socket = httpsAgent.originalCreateConnection(port, host, options);
  socket.setNoDelay(true);
  return socket;
};

module.exports = {
  VERSION,
  MODULE_LOAD_TIME,
  PROCESS_ID,
  COLDSTART,
  httpsAgent
};
