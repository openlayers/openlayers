import MVT from "../format/MVT";
import RenderFeature from "../render/Feature";
import OLWorker from './export';

var blob;
try {
  blob = new Blob([OLWorker], {type: 'application/javascript'});
} catch (e) { // Backwards-compatibility
  blob = new MSBlobBuilder();
  blob.append(OLWorker);
  blob = blob.getBlob();
}

var worker = new Worker(URL.createObjectURL(blob));

const format = new MVT();
const projection = format.readProjection();

const tiles = {};

worker.onmessage = function(event) {
  console.log('received in app', event.data);
  const url = event.data.url;
  const tile = tiles[url];
  if (event.data.what === 'features') {
    event.data.features.forEach(e => e.__proto__ = RenderFeature.prototype);  // restore prototype chain
    tile.onLoad(event.data.features, projection, event.data.extent);
  } else if (event.data.what === 'error') {
    tile.onError();
  }
  delete tiles[url];
};

export function workerfeatureloader(tile, url) {
  tiles[url] = tile;
  const loader = function() {
    worker.postMessage({
      action: 'load',
      url
    });
  };
  tile.setLoader(loader);
}
