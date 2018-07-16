import nock from 'nock';
import _ from 'lodash';

import { set } from '../invocationContext';
import lib from '.';

const requiredKeys = ['arn', 'requestId', 'timestamp', 'extension'];

const hasRequiredKeys = obj => {
  return (
    _.chain(obj)
      .pick(requiredKeys)
      .values()
      .compact()
      .value().length === requiredKeys.length
  );
};

const testResponse = {
  jwtAccess: 'jwt-here',
  signedRequest: 'aws.com/signed'
};

beforeEach(() => {
  // set the context like the core lib would
  set({
    invokedFunctionArn: 'test',
    awsRequestId: '1234'
  });
  nock(/signer/)
    .post('/', hasRequiredKeys)
    .reply(200, testResponse);
  nock(/signer/)
    .post('/', b => !hasRequiredKeys(b))
    .reply(500, { error: true });
});

afterEach(() => {
  // reset the context like the core lib would
  set(undefined);
});

describe('fileUpload', () => {
  test('Works when supplied args', async () => {
    const val = await lib({
      arn: 'wow',
      requestId: '1234',
      timestamp: 1530827699329,
      auth: 'auth-woot'
    });
    expect(val).toEqual(testResponse);
  });

  test('Works without supplied args', async () => {
    const val = await lib();
    expect(val).toEqual(testResponse);
  });
});
