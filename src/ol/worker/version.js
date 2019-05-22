/**
 * A worker that responds to messages by posting a message with the version identifer.
 * @module ol/worker/version
 */
import {VERSION} from '../util';

onmessage = event => {
  console.log('version worker received message:', event.data); // eslint-disable-line
  postMessage(`version: ${VERSION}`);
};

export let create;
