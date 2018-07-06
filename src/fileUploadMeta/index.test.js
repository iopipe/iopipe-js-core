import nock from 'nock';

import lib from '.';

describe('fileUpload', () => {
  test('Works', async () => {
    const testResponse = {
      jwtAccess: 'jwt-here',
      signedRequest: 'aws.com/signed'
    };
    // shim the http request for testing
    nock(/signer/)
      .post('/')
      .reply(200, testResponse);

    const val = await lib({
      arn: 'wow',
      requestId: '1234',
      timestamp: 1530827699329,
      auth: 'auth-woot'
    });
    expect(val).toEqual(testResponse);
  });
});
