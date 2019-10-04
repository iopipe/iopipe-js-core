import { SUPPORTED_SIGNER_REGIONS } from '../constants';

const supported = new Map(SUPPORTED_SIGNER_REGIONS);
// allow us-east-1 for signer util
supported.set('us-east-1', true);

const fallbackSigners = {
  'ap-northeast-2': 'ap-northeast-1',
  'ap-south-1': 'ap-southeast-2',
  'ap-southeast-1': 'ap-southeast-2',
  'ap-southeast-2': 'ap-southeast-2',
  'ca-central-1': 'us-east-2',
  'eu-central-1': 'eu-west-1',
  'eu-west-2': 'eu-west-1',
  'eu-east-1': 'eu-east-1',
  'us-west-1': 'us-west-1'
};

export default function getSignerHostname() {
  const { AWS_REGION } = process.env;
  const signer = supported.has(AWS_REGION)
    ? AWS_REGION
    : fallbackSigners[AWS_REGION];

  return `https://signer.${signer ? signer : 'us-west-2'}.iopipe.com/`;
}
