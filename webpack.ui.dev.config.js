import path from 'path';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: path.resolve(__dirname, 'public'),
    compress: true,
    port: 9000,
    hot: true,
    open: true,
    devMiddleware: {
      writeToDisk: true,
    },
    proxy: {
      '/api': 'http://localhost:3001',
    },
    watchFiles: ['public/**/*'],
  },
};
