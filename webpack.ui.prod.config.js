// eslint-disable-next-line import/no-extraneous-dependencies
import TerserPlugin from 'terser-webpack-plugin';

export default {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ],
  }
};
