export function convertToString(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
