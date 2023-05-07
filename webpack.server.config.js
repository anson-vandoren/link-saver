import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import nodeExternals from 'webpack-node-externals';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  mode: 'production',
  target: 'node',
  experiments: {
    topLevelAwait: true,
  },
  externals: [nodeExternals()],
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: 'current',
                  },
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.server.json',
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      (compiler) => {
        import('terser-webpack-plugin').then(({ default: TerserPlugin }) => {
          new TerserPlugin({
            exclude: /node_modules/,
          }).apply(compiler);
        });
      },
    ],
  },
};
