const SUPPORTED_REGIONS = new Map(
  [
    'ap-northeast-1',
    'ap-southeast-2',
    'eu-west-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2'
  ].map(s => [s, true])
);

export { SUPPORTED_REGIONS };
