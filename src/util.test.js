import { convertToString } from './util';

test('converts to string', () => {
  expect(convertToString('Foo')).toBe('Foo');
  expect(convertToString(undefined)).toBe('undefined');
  expect(convertToString(NaN)).toBe('NaN');
  expect(convertToString({ foo: 1 })).toBe('{"foo":1}');
  expect(convertToString([1, 2])).toBe('[1,2]');
});
