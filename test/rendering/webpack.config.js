import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

const baseDir = dirname(fileURLToPath(import.meta.url));

const cases = path.join(baseDir, 'cases');

const caseDirs = fs.readdirSync(cases).filter((name) => {
  let exists = true;
  try {
    fs.accessSync(path.join(cases, name, 'main.js'));
  } catch (err) {
    exists = false;
  }
  return exists;
});

const entry = {};
caseDirs.forEach((c) => {
  entry[`cases/${c}/main`] = `./cases/${c}/main.js`;
});

export default {
  context: baseDir,
  target: 'web',
  entry: entry,
  devtool: 'source-map',
  stats: 'minimal',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: path.join(
            baseDir,
            '../../examples/webpack/worker-loader.cjs'
          ),
        },
        include: [path.join(baseDir, '../../src/ol/worker')],
      },
    ],
  },
  resolve: {
    fallback: {
      fs: false,
      http: false,
      https: false,
    },
    alias: {
      // ol-mapbox-style imports ol/style/Style etc
      ol: path.join(baseDir, '..', '..', 'src', 'ol'),
    },
  },
};
