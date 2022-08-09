import Metalsmith from 'metalsmith';
import inPlace from '@metalsmith/in-place';
import layouts from '@metalsmith/layouts';
import markdown from '@metalsmith/markdown';
import {dirname} from 'node:path';
import {env} from 'node:process';
import {fileURLToPath} from 'node:url';

const baseDir = dirname(fileURLToPath(import.meta.url));

const builder = Metalsmith(baseDir)
  .source('./src')
  .destination('./build')
  .clean(true)
  .metadata({
    version: env.OL_VERSION || 'dev',
  })
  .use(inPlace())
  .use(markdown())
  .use(layouts());

builder.build((err) => {
  if (err) {
    throw err;
  }
});
