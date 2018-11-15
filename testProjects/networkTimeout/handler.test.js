const iopipe = require('./iopipe.js');

describe('Call to non-existant endpoint should time out after specd timeout - 100ms', () => {
  test('Test network timeouts', done => {
    const getMeta = iopipe.util.getFileUploadMeta;
    const start = new Date().getTime();
    iopipe({
      clientId: 'foobar'
    })(async () => {
      try {
        await getMeta({
          requestId: 'testFoo',
          networkTimeout: 100,
          url: 'http://example.com:81'
        });
      } catch (e) {
        const end = new Date().getTime();
        const duration = end - start;
        expect(e.message).toEqual('Request timed out');
        expect(duration).toBeGreaterThan(100);
        expect(duration).toBeLessThan(1000);
        done();
      }
    })({}, {});
  });
});

describe('Call to non-existant endpoint should time out after specd timeout - 3500ms', () => {
  test('Test network timeouts', done => {
    const getMeta = iopipe.util.getFileUploadMeta;
    const start = new Date().getTime();
    iopipe({
      clientId: 'foobar'
    })(async () => {
      try {
        await getMeta({
          requestId: 'testFoo',
          networkTimeout: 3500,
          url: 'http://example.com:81'
        });
      } catch (e) {
        const end = new Date().getTime();
        const duration = end - start;
        expect(e.message).toEqual('Request timed out');
        expect(duration).toBeGreaterThan(3500);
        expect(duration).toBeLessThan(4500);
        done();
      }
    })({}, {});
  });
});
