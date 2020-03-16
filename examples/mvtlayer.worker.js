import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import MVT from '../src/ol/format/MVT.js';
import {Projection} from '../src/ol/proj.js';
import TileQueue from '../src/ol/TileQueue.js';
import {getTilePriority as tilePriorityFunction} from '../src/ol/TileQueue.js';
import {Style, Fill, Stroke, Icon, Text} from '../src/ol/style.js';
import createMapboxStreetsV6Style from './resources/mapbox-streets-v6-style.js';
import {renderDeclutterItems} from '../src/ol/render.js';

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

/** @type {any} */
const worker = self;

let frameState;
const canvas = new OffscreenCanvas(1, 1);

function getCircularReplacer() {
  const seen = new WeakSet();
  return function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

function getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
  return tilePriorityFunction(frameState, tile, tileSourceKey, tileCenter, tileResolution);
}

const layer = new VectorTileLayer({
  declutter: true,
  style: createMapboxStreetsV6Style(Style, Fill, Stroke, Icon, Text),
  source: new VectorTileSource({
    format: new MVT(),
    url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key
  })
});
const renderer = layer.getRenderer();
const tileQueue = new TileQueue(getTilePriority, function() {
  worker.postMessage({type: 'request-render'});
});
const maxTotalLoading = 8;
const maxNewLoads = 2;

let rendererTransform, rendererOpacity;
renderer.useContainer = function(target, transform, opacity) {
  target.style = {};
  this.canvas = target;
  this.context = target.getContext('2d');
  this.container = {
    firstElementChild: target
  };
  rendererTransform = transform;
  rendererOpacity = opacity;
};

let rendering = false;

worker.addEventListener('message', function(event) {
  if (event.data.type !== 'render') {
    return;
  }
  if (rendering) {
    // drop this frame
    worker.postMessage({type: 'request-render'});
    return;
  }
  frameState = event.data.frameState;
  frameState.tileQueue = tileQueue;
  frameState.viewState.projection.__proto__ = Projection.prototype;
  rendering = true;
  requestAnimationFrame(function() {
    renderer.renderFrame(frameState, canvas);
    renderDeclutterItems(frameState, null);
    if (tileQueue.getTilesLoading() < maxTotalLoading) {
      tileQueue.reprioritize(); // FIXME only call if view has changed
      tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
    }
    const imageData = canvas.transferToImageBitmap();
    worker.postMessage({
      type: 'rendered',
      imageData: imageData,
      transform: rendererTransform,
      opacity: rendererOpacity,
      frameState: JSON.parse(JSON.stringify(frameState, getCircularReplacer()))
    }, [imageData]);
    rendering = false;
  });
});

export let create;
