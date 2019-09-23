/**
 * A worker that responds to messages by posting a message with the version identifer.
 * @module ol/worker/version
 */
import {VERSION} from '../util.js';

/** @type {any} */
const worker = self;

worker.onmessage = event => {
  console.log('version worker received message:', event.data); // eslint-disable-line
  worker.postMessage(`version: ${VERSION}`);
};

export let create;
