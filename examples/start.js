const webpack = require("webpack");
const config = require("./webpack.config");
const compiler = webpack(config);

const watching = compiler.watch(
  {
    aggregateTimeout: 300,
    poll: undefined,
  },
  (err, stats) => {
    console.log(stats);
  }
);
