import 'regenerator-runtime/runtime.js';

import {Transfer, expose} from 'threads/worker';

async function decode(fileDirectory, buffer) {
  const {getDecoder} = await import('geotiff/src/compression');
  const decoder = await getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return Transfer(decoded);
}

expose(decode);

export let create;
