/**
 * @module ol/worker/version
 * A worker that responds to messages by posting a message with the version identifer.
 */
import {VERSION} from '../util';

onmessage = event => {
  console.log('version worker received message:', event.data); // eslint-disable-line
  // @ts-ignore
  postMessage(`version: ${VERSION}`);
};

export let create;
