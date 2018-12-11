const webpack = require('webpack');
const path = require('path');
const DashboardPlugin = require('webpack-dashboard/plugin');

let plugins;
const sourcePath = path.join(__dirname, './src');
// const outPath = path.join(__dirname, './dist');

if (process.env.NODE_ENV === 'production') {
  plugins = [
    new webpack.EnvironmentPlugin(['NODE_ENV'])
  ];
}
else {
  plugins = [
    new DashboardPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV'])
  ];
}

module.exports = {// entry: process.env.NODE_ENV === 'production'?['babel-polyfill', './src/app.jsx']:['./src/app.jsx'],
  entry:  process.env.NODE_ENV === 'production'?['babel-polyfill', `${sourcePath}/app.tsx`]:[`${sourcePath}/app.tsx`],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: process.env.NODE_ENV === 'production'?[{
          loader: 'babel-loader'
        }, {
          loader: 'awesome-typescript-loader'
        }]:{
          loader: 'awesome-typescript-loader'
        }
      }
    ]
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  externals: {
    _: '_',
    $: 'jQuery',
    react: 'React',
    'react-dom': 'ReactDOM',
    'echarts': 'echarts',
    'xlsx': 'XLSX',
    sweetalert: {
      root: 'swal'
    },
    moment: 'moment'
  },
  devServer: {
    contentBase: sourcePath,
    hot: true,
    inline: true,
    historyApiFallback: {
      disableDotRule: true
    },
    stats: 'minimal'
  }
};
