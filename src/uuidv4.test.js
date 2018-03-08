import _ from 'lodash';
import uuid from './uuidv4';

const numResults = 1e4;

test('Generates random uuid', () => {
  const results = _.range(numResults).map(() => uuid());
  expect(_.uniq(results)).toHaveLength(numResults);
});
