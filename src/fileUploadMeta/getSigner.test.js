import lib from './getSigner';

beforeEach(() => {
  delete process.env.AWS_REGION;
});

describe('getSigner', () => {
  test('Defaults to us-west-2', () => {
    expect(lib()).toEqual('https://signer.us-west-2.iopipe.com/');
  });

  test('Uses region if it is supported', () => {
    process.env.AWS_REGION = 'us-east-1';
    expect(lib()).toEqual('https://signer.us-east-1.iopipe.com/');
  });

  test('Uses us-west-2 if region is not supported', () => {
    process.env.AWS_REGION = 'eu-west-3';
    expect(lib()).toEqual('https://signer.us-west-2.iopipe.com/');
  });
});
