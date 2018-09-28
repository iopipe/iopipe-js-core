export default function(string) {
  switch (string.toLowerCase().trim()) {
    case 'true':
    case 't':
    case '1':
      return true;
    case 'false':
    case 'f':
    case '0':
    case null:
      return false;
    default:
      return Boolean(string);
  }
}
