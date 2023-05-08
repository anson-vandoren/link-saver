import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { merge } from 'webpack-merge';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const baseConfig = {
  context: path.resolve(__dirname, 'public'),
  entry: './js/index.ts', // Replace with the path to your main TypeScript entry point
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { configFile: 'tsconfig.ui.json' },
        },
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'public')],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

export default async (env) => {
  const envConfig = await import(`./webpack.ui.${env.env}.config.js`);
  return merge(baseConfig, envConfig.default);
};
