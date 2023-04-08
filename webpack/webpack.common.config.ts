import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve } from 'path';
import { Configuration } from 'webpack';

// Constants
import { APP_TITLE, BUILD_PATH, SRC_PATH } from './constants';

const COMMON_PATH: string = resolve(SRC_PATH, 'common');
const EXTENSION_PATH: string = resolve(SRC_PATH, 'extension');
const EXTERNAL_PATH: string = resolve(SRC_PATH, 'external');
const config: Configuration = {
  entry: {
    // injected scripts
    ['wallet-initializer']: resolve(SRC_PATH, 'wallet-initializer.ts'),
    ['background']: resolve(SRC_PATH, 'background.ts'),
    ['content-script']: resolve(SRC_PATH, 'content-script.ts'),
    // extension apps
    ['enable-app']: resolve(EXTENSION_PATH, 'apps', 'enable', 'index.ts'),
    ['main-app']: resolve(EXTENSION_PATH, 'apps', 'main', 'index.ts'),
    ['registration-app']: resolve(
      EXTENSION_PATH,
      'apps',
      'registration',
      'index.ts'
    ),
    ['sign-bytes-app']: resolve(
      EXTENSION_PATH,
      'apps',
      'sign-bytes',
      'index.ts'
    ),
  },
  module: {
    rules: [
      {
        loader: 'handlebars-loader',
        test: /\.hbs$/,
      },
      {
        test: /\.(svg?.+|ttf?.+|woff?.+|woff2?.+)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  },
  output: {
    clean: true,
    filename: '[name].js',
    path: BUILD_PATH,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: resolve(SRC_PATH, 'icons'),
          to: resolve(BUILD_PATH, 'icons'),
        },
        {
          from: resolve(SRC_PATH, 'manifest.json'),
        },
      ],
    }),
    /* HTMLs */
    new HtmlWebpackPlugin({
      chunks: ['enable-app'],
      filename: 'enable.html',
      inject: 'head',
      template: resolve(SRC_PATH, 'index.hbs'),
      title: APP_TITLE,
    }),
    new HtmlWebpackPlugin({
      chunks: ['main-app'],
      filename: 'main.html',
      inject: 'head',
      template: resolve(SRC_PATH, 'index.hbs'),
      title: APP_TITLE,
    }),
    new HtmlWebpackPlugin({
      chunks: ['registration-app'],
      filename: 'registration.html',
      inject: 'head',
      template: resolve(SRC_PATH, 'index.hbs'),
      title: APP_TITLE,
    }),
    new HtmlWebpackPlugin({
      chunks: ['sign-bytes-app'],
      filename: 'sign_bytes.html',
      inject: 'head',
      template: resolve(SRC_PATH, 'index.hbs'),
      title: APP_TITLE,
    }),
  ],
  resolve: {
    alias: {
      // Common
      ['@common/enums']: resolve(COMMON_PATH, 'enums'),
      ['@common/errors']: resolve(COMMON_PATH, 'errors'),
      ['@common/events']: resolve(COMMON_PATH, 'events'),
      ['@common/types']: resolve(COMMON_PATH, 'types'),
      ['@common/utils']: resolve(COMMON_PATH, 'utils'),
      // Extension
      ['@extension/components']: resolve(EXTENSION_PATH, 'components'),
      ['@extension/config']: resolve(EXTENSION_PATH, 'config'),
      ['@extension/constants']: resolve(EXTENSION_PATH, 'constants'),
      ['@extension/enums']: resolve(EXTENSION_PATH, 'enums'),
      ['@extension/errors']: resolve(EXTENSION_PATH, 'errors'),
      ['@extension/events']: resolve(EXTENSION_PATH, 'events'),
      ['@extension/features/accounts']: resolve(
        EXTENSION_PATH,
        'features',
        'accounts'
      ),
      ['@extension/features/application']: resolve(
        EXTENSION_PATH,
        'features',
        'application'
      ),
      ['@extension/features/messages']: resolve(
        EXTENSION_PATH,
        'features',
        'messages'
      ),
      ['@extension/features/networks']: resolve(
        EXTENSION_PATH,
        'features',
        'networks'
      ),
      ['@extension/features/registration']: resolve(
        EXTENSION_PATH,
        'features',
        'registration'
      ),
      ['@extension/features/sessions']: resolve(
        EXTENSION_PATH,
        'features',
        'sessions'
      ),
      ['@extension/features/settings']: resolve(
        EXTENSION_PATH,
        'features',
        'settings'
      ),
      ['@extension/fonts']: resolve(EXTENSION_PATH, 'fonts'),
      ['@extension/hooks']: resolve(EXTENSION_PATH, 'hooks'),
      ['@extension/pages']: resolve(EXTENSION_PATH, 'pages'),
      ['@extension/selectors']: resolve(EXTENSION_PATH, 'selectors'),
      ['@extension/services']: resolve(EXTENSION_PATH, 'services'),
      ['@extension/theme']: resolve(EXTENSION_PATH, 'theme'),
      ['@extension/translations']: resolve(EXTENSION_PATH, 'translations'),
      ['@extension/types']: resolve(EXTENSION_PATH, 'types'),
      ['@extension/utils']: resolve(EXTENSION_PATH, 'utils'),
      // External
      ['@external/constants']: resolve(EXTERNAL_PATH, 'constants'),
      ['@external/services']: resolve(EXTERNAL_PATH, 'services'),
      ['@external/types']: resolve(EXTERNAL_PATH, 'types'),
    },
    extensions: ['.js', '.ts', '.tsx'],
  },
};

export default config;
