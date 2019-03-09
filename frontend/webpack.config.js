var path = require("path");
let webpack = require('webpack');


let srcDir = path.join(__dirname, "src/");
let distDir = path.join(__dirname, "public/js");

module.exports = {
  mode: 'production',
  entry: path.join(srcDir, 'index.jsx'),
  output: {
    path: distDir,
    publicPath: '/public/',
    filename: "app.js",
    sourceMapFilename: "[file].map"
  },
  module: {
    rules: [
      { test: /\.js|.jsx?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }]
    }]
  },
  resolve: { 
    modules: [
      'node_modules',
      path.resolve(srcDir),
      path.resolve(path.join(srcDir, 'common')),
    ],
    extensions: [".js", ".jsx"]
  },
  devServer: {
    historyApiFallback: true,
    contentBase: './'
  },
  devtool: 'sourcemap'
};