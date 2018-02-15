export class MockPlugin {
  constructor() {
    return this;
  }
  get meta() {
    return {
      name: 'mock-plugin'
    };
  }
}

export class MockTracePlugin {
  constructor() {
    return this;
  }
  get meta() {
    return {
      name: '@iopipe/trace',
      version: 'mocked-trace'
    };
  }
}
