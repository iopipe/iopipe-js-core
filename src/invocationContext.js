let invocationContext;

export const set = val => (invocationContext = val);
export const get = () => invocationContext;
