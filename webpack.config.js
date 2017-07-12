const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './iopipe.js',
    libraryTarget: 'commonjs2',
    library: 'iopipe'
  },
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
