const path = require("path")
//const webpack = require('webpack');

module.exports = {
  target: "node",
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "./iopipe.js",
    libraryTarget: 'commonjs2',
    library: "iopipe"
  },
  /*plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]*/
}
