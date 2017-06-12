const path = require("path")

module.exports = {
  target: "node",
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: "./iopipe.js",
    libraryTarget: 'commonjs2',
    library: "iopipe"
  }
}
