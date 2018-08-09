// ⬇ these are typically the regions we have collectors in
// we also support us-east-1 but due to DNS constraints we cannot list it here
const SUPPORTED_REGIONS = new Map(
  [
    'ap-northeast-1',
    'ap-southeast-2',
    'eu-west-1',
    'us-east-2',
    'us-west-1',
    'us-west-2'
    // construct the map where each key is a region and the value is true (supported)
  ].map(s => [s, true])
);

export { SUPPORTED_REGIONS };
