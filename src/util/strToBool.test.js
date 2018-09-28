import strToBool from './strToBool';

test('Strings are cast as bools', () => {
  expect(strToBool('true')).toBe(true);
  expect(strToBool('True')).toBe(true);
  expect(strToBool('t')).toBe(true);
  expect(strToBool('1')).toBe(true);

  expect(strToBool('false')).toBe(false);
  expect(strToBool('False')).toBe(false);
  expect(strToBool('f')).toBe(false);
  expect(strToBool('0')).toBe(false);
});
