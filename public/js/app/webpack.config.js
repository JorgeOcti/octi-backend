const webpack = require('webpack');
const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryCliPlugin = require('@sentry/webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

let plugins;
const sourcePath = path.join(__dirname, './src');
// const outPath = path.join(__dirname, './dist');

if (process.env.NODE_ENV === 'production') {
  plugins = [
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new SentryCliPlugin({
      include: '.',
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js'],
      configFile: 'sentry.properties',
      dryRun: true
    })
  ];
} else {
  plugins = [
    // new BundleAnalyzerPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV'])
  ];
}

const setDevTool = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'inline-source-map';
  } else if (process.env.NODE_ENV === 'production') {
    return 'source-map';
  }
};

module.exports = {// entry: process.env.NODE_ENV === 'production'?['babel-polyfill', './src/app.jsx']:['./src/app.jsx'],
  entry: process.env.NODE_ENV === 'production' ? [`${sourcePath}/App.tsx`] : [`${sourcePath}/App.tsx`],
  output: {
    // filename: '[name].bundle.[hash].js',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendors'
      // maxSize: 128000,
    }
  },
  performance: {
    // hints: false,
    maxEntrypointSize: 20480000,
    maxAssetSize: 1024000
  },
  module: {
    rules: [
      // {
      //   test: /\.(js|jsx)$/,
      //   exclude: /node_modules/,
      //   use: {
      //     loader: 'babel-loader'
      //   },
      // },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: process.env.NODE_ENV === 'production' ? [{
          loader: 'babel-loader'
        }, {
          loader: 'ts-loader',
          // options: {
          //   transpileOnly: true,
          // },
        }] : {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              tsBuildInfoFile: "./buildcache/buildcache",
              target: 'es5',
              incremental: true  // this could also be in tsconfig.json directly
            },
            // transpileOnly: true,
          },
        },
      },
    ],
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
    }
  },
  externals: {
    _: '_',
    $: 'jQuery',
    react: 'React',
    'react-dom': 'ReactDOM',
    'echarts': 'echarts',
    'xlsx': 'XLSX',
    sweetalert: 'swal',
    moment: 'moment',
    'moment-timezone': 'moment'
  },
  devtool: setDevTool(),
  devServer: {
    contentBase: sourcePath,
    hot: true,
    inline: true,
    historyApiFallback: {
      disableDotRule: true
    },
    stats: 'minimal'
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
