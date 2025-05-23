// /repos/ocmui-devtools/sol-sc-explorer/webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  // Determine if we're in development or production mode based on the --mode flag
  const isDevelopment = argv.mode === 'development';

  // Determine if Webpack's watch mode is active based on the --watch flag
  // The 'argv' object passed by Webpack CLI will have a 'watch' property
  // set to true if the --watch flag was used.
  const isWatching = argv.watch === true;

  return {
    mode: isDevelopment ? 'development' : 'production',

    // Enable source maps for better debugging in development mode
    // For production, 'false' or 'source-map' (for debugging production issues) are common
    devtool: isDevelopment ? 'cheap-module-source-map' : false,

    // Define the entry points for your extension's JavaScript files
    entry: {
      'content-script': './src/content-script/main.js',
      background: './src/background.js',
      popup: './src/popup.js',
    },

    // Configure how and where Webpack outputs the bundled files
    output: {
      path: path.resolve(__dirname, 'dist'), // Output directory: './dist/'
      filename: '[name].js',                 // Output filename pattern: e.g., content-script.js, background.js
      clean: true,                           // Clean the 'dist' folder before each build
    },

    // Define rules for how different types of files (modules) should be processed
    module: {
      rules: [
        {
          test: /\.js$/, // Apply this rule to .js files
          exclude: /node_modules/, // Don't transpile code from node_modules
          use: {
            loader: 'babel-loader', // Use Babel to transpile JavaScript
            options: {
              presets: ['@babel/preset-env'], // Use preset-env for modern JS compatibility
            },
          },
        },
      ],
    },

    // Configure Webpack plugins
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: './src/manifest.json', to: 'manifest.json' },
          { from: './src/popup.html', to: 'popup.html' },
          { from: './src/icons', to: 'icons' },
          { from: './src/images', to: 'images', noErrorOnMissing: true },
        ],
      }),
    ],

    // Enable Webpack's watch mode ONLY if the --watch flag was passed to the CLI
    watch: isWatching,
    watchOptions: {
      ignored: /node_modules/, // Don't watch node_modules for changes
    },
  };
};