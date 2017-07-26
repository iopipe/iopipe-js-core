export const hooks = [
  'pre:setup',
  'post:setup',
  'pre:invoke',
  'post:invoke',
  'pre:report',
  'post:report'
];

export function getHook(hook) {
  const val = hooks.find(str => str === hook);
  if (!val) {
    console.error(`Hook ${hook} not found.`);
    return 'none';
  }
  return val;
}
