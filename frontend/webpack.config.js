var path = require("path");
let webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');


let srcDir = path.join(__dirname, "src/");
let distDir = path.join(__dirname, "public/");

module.exports = {
  mode: 'production',
  entry: path.join(srcDir, 'index.jsx'),
  output: {
    path: distDir,
    publicPath: '/',
    filename: "js/app.[contenthash].js",
    sourceMapFilename: "[file].map"
  },
  module: {
    rules: [
      {
        test: /\.js|.jsx?$/,
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
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html'
    }),
  ],
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