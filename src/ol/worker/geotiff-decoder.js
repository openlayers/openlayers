import 'regenerator-runtime/runtime.js';

// BEGIN copied from geotiff/src/decoder.worker.js
import {Transfer, expose} from 'threads/worker';
import {getDecoder} from 'geotiff/src/compression';

async function decode(fileDirectory, buffer) {
  const decoder = await getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return Transfer(decoded);
}

expose(decode);
// END copied from geotiff/src/decoder.worker.js

export let create;
