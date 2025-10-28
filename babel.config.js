module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    ['@babel/preset-typescript', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    ['react-native-worklets-core/plugin', { processNestedWorklets: true }],
    'react-native-reanimated/plugin',
  ],
};