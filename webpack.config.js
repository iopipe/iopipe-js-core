const path = require('path');
const _ = require('lodash');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './iopipe.js',
    libraryTarget: 'commonjs2',
    library: 'iopipe'
  },
  plugins: _.compact([process.env.ANALYZE && new BundleAnalyzerPlugin()]),
  externals: [
    nodeExternals({
      whitelist: [/babel-runtime/, /regenerator-runtime/, /core-js/]
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
