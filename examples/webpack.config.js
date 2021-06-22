const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DownloadWebpackPlugin } = require("../dist/index.js");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "./index.js"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new DownloadWebpackPlugin({
      assets: [{ url: "https://at.alicdn.com/t/font_2354835_qnv0o96ch.js" }],
      filePath: "/mydowload",
    }),
    new HtmlWebpackPlugin(),
  ],
};
