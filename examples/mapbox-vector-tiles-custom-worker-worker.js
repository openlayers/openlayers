import MVT from '../src/ol/format/MVT';
import CustomVectorTileLayer from './mapbox-vector-tiles-custom-worker-layer';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {createMapboxStreetsV6Style} from './resources/mapbox-streets-v6-style.js';
import {get as getProjection} from '../src/ol/proj.js';
import {Style, Fill, Stroke, Icon, Text} from '../src/ol/style';
import {setLoadImageHelper} from '../src/ol/loadImage';
import {domFallbacks} from '../src/ol/dom.js';
import {cssFallbacks} from '../src/ol/css';
import {setMeasureTextHeightHelper} from '../src/ol/render/canvas';
import {getUid} from '../src/ol/util';
import {loadImageFromWithinWorker, registerMessageListenerForWorker} from './mapbox-vector-tiles-custom-worker-image';


const stopAtInstructionsCreation = false;

// Return offscreen canvases instead of DOM based ones
domFallbacks.createCanvas = function(opt_width, opt_height) {
  const canvas = new self.OffscreenCanvas(opt_width || 300, opt_height || 150);
  canvas.style = {};
  return canvas;
};

// Disable font families logics as it is not available to workers
cssFallbacks.getFontFamilies = function() {
  return null;
};

// Disable text height measurement
// An improvement would to delegate the computation to the main thread
setMeasureTextHeightHelper(function() {
  return 12;
});

// Delegate images loading to the main thread
setLoadImageHelper(loadImageFromWithinWorker);

// Listen for image loading messages from the main thread
registerMessageListenerForWorker();

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

const layer = new CustomVectorTileLayer({
  declutter: true,
  useInterimTilesOnError: false,
  renderMode: 'image',
  source: new VectorTileSource({
    attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
      '© <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>',
    format: new MVT(),
    url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
        '{z}/{x}/{y}.vector.pbf?access_token=' + key
  }),
  style: createMapboxStreetsV6Style(Style, Fill, Stroke, Icon, Text)
});


const renderer = /** @type {CanvasVectorTileLayerRenderer} */ (layer.createRenderer());
const epsg3857 = getProjection('EPSG:3857');


/**
 * @param {number} messageId An opaque id from the main thread.
 * @param {string} tileId The tile uuid.
 * @param {VectorRenderTile} tile The rendered tile.
 */
function success(messageId, tileId, tile) {
  // Executors are not yet serializable.
  // So we render up-to a transferable canvas for now.
  let executorGroup = [];
  const images = [];
  if (!stopAtInstructionsCreation) {
    const offscreenCanvas = renderer.getTileImage(tile);
    const bitmap = offscreenCanvas['transferToImageBitmap']();
    images.push(bitmap);
  } else {
    executorGroup = tile.executorGroups[getUid(layer)];
    executorGroup[0].hitDetectionContext_ = null; // remove non-transferable context
  }

  self.postMessage({
    action: 'preparedTile',
    messageId: messageId,
    tileId: tileId,
    images: images,
    executorGroup: executorGroup
  }, images);
}

function failure(messageId, tileId, tile) {
  self.postMessage({
    action: 'failedTilePreparation',
    state: tile.getState(),
    messageId: messageId,
    tileId: tileId
  });
}

addEventListener('message', function(event) {
  const action = event.data.action;
  if (action === 'prepareTile') {
    const {messageId, tileId, tileCoord, pixelRatio} = event.data;
    const [z, x, y] = tileCoord;
    const successFn = success.bind(null, messageId, tileId);
    const errorFn = failure.bind(null, messageId, tileId);
    renderer.prepareTileInWorker(z, x, y, pixelRatio, epsg3857, tileId,
      successFn, errorFn, stopAtInstructionsCreation);
  }
});
