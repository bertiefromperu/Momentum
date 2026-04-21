if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

global.__ExpoImportMetaRegistry = new Proxy({}, {
  get: () => undefined,
  set: () => true,
});

jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
