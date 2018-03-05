const supportedEnvVars = [
  'IOPIPE_TOKEN',
  'IOPIPE_DEBUG',
  'IOPIPE_ENABLED',
  'IOPIPE_INSTALL_METHOD',
  'IOPIPE_CLIENTID',
  'IOPIPE_NETWORK_TIMEOUT',
  'IOPIPE_TIMEOUT_WINDOW',
  'AWS_REGION',
  'AWS_SAM_LOCAL'
];

function resetEnv() {
  supportedEnvVars.forEach(str => delete process.env[str]);
}

export { resetEnv, supportedEnvVars };
