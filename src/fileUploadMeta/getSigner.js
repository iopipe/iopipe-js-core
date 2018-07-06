import { SUPPORTED_REGIONS } from '../constants';

export default function getSignerHostname() {
  const { AWS_REGION } = process.env;
  return `https://signer.${
    SUPPORTED_REGIONS.has(AWS_REGION) ? AWS_REGION : 'us-west-2'
  }.iopipe.com/`;
}
