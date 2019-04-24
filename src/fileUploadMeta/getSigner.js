import { SUPPORTED_SIGNER_REGIONS } from '../constants';

const supported = new Map(SUPPORTED_SIGNER_REGIONS);
// allow us-east-1 for signer util
supported.set('us-east-1', true);

export default function getSignerHostname() {
  const { AWS_REGION } = process.env;
  return `https://signer.${
    supported.has(AWS_REGION) ? AWS_REGION : 'us-west-2'
  }.iopipe.com/`;
}
