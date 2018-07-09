import { SUPPORTED_REGIONS } from '../constants';

export default function getSignerHostname() {
  const { AWS_REGION } = process.env;
  const supported = new Map(SUPPORTED_REGIONS);
  // allow us-east-1 for signer util
  supported.set('us-east-1', true);
  return `https://signer.${
    supported.has(AWS_REGION) ? AWS_REGION : 'us-west-2'
  }.iopipe.com/`;
}
