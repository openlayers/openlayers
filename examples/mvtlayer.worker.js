import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import MVT from '../src/ol/format/MVT.js';
import {Projection} from '../src/ol/proj.js';
import TileQueue from '../src/ol/TileQueue.js';
import {getTilePriority as tilePriorityFunction} from '../src/ol/TileQueue.js';

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

/** @type {any} */
const worker = self;

let frameState;

function getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
  return tilePriorityFunction(frameState, tile, tileSourceKey, tileCenter, tileResolution);
}

const layer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    format: new MVT(),
    url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key
  })
});
const tileQueue = new TileQueue(getTilePriority, function() {
  worker.postMessage({type: 'render'});
});
const maxTotalLoading = 8;
const maxNewLoads = 2;

const renderer = layer.getRenderer();

renderer.useContainer = function(target, transform, opacity) {
  target.style = {};
  this.canvas = target;
  this.context = target.getContext('2d');
  this.container = {
    firstElementChild: target
  };
  worker.postMessage({
    type: 'transform-opacity',
    transform: transform,
    opacity: opacity
  });
};

let canvas;
let rendering = false;

worker.onmessage = function(event) {
  if (rendering) {
    // drop this frame
    return;
  }
  if (event.data.canvas) {
    canvas = event.data.canvas;
  } else {
    frameState = event.data.frameState;
    frameState.tileQueue = tileQueue;
    frameState.viewState.projection.__proto__ = Projection.prototype;
    rendering = true;
    requestAnimationFrame(function() {
      renderer.renderFrame(frameState, canvas);
      if (tileQueue.getTilesLoading() < maxTotalLoading) {
        tileQueue.reprioritize(); // FIXME only call if view has changed
        tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
      }
      rendering = false;
    });
  }
};

export let create;
