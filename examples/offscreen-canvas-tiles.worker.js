import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import MVT from '../src/ol/format/MVT.js';
import {Projection} from '../src/ol/proj.js';
import TileQueue from '../src/ol/TileQueue.js';
import {getTilePriority as tilePriorityFunction} from '../src/ol/TileQueue.js';
import {renderDeclutterItems} from '../src/ol/render.js';
import styleFunction from 'ol-mapbox-style/dist/stylefunction.js';
import {inView} from '../src/ol/layer/Layer.js';

/** @type {any} */
const worker = self;

let frameState, pixelRatio;
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

const landcover = new VectorTileLayer({
  visible: false,
  declutter: true,
  maxZoom: 9,
  source: new VectorTileSource({
    maxZoom: 9,
    format: new MVT(),
    url: 'https://api.maptiler.com/tiles/landcover/{z}/{x}/{y}.pbf?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
  })
});
const contours = new VectorTileLayer({
  visible: false,
  declutter: true,
  minZoom: 9,
  maxZoom: 14,
  source: new VectorTileSource({
    minZoom: 9,
    maxZoom: 14,
    format: new MVT(),
    url: 'https://api.maptiler.com/tiles/contours/{z}/{x}/{y}.pbf?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
  })
});
const openmaptiles = new VectorTileLayer({
  visible: false,
  declutter: true,
  source: new VectorTileSource({
    format: new MVT(),
    maxZoom: 14,
    url: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
  })
});

const layers = [landcover, contours, openmaptiles];
let rendererTransform;
layers.forEach(layer => {
  layer.once('change', () => {
    layer.setVisible(true);
    worker.postMessage({action: 'request-render'});
  });
  layer.getRenderer().useContainer = function(target, transform) {
    this.containerReused = this.getLayer() !== layers[0];
    target.style = {};
    this.canvas = target;
    this.context = target.getContext('2d');
    this.container = {
      firstElementChild: target
    };
    rendererTransform = transform;
  };
});

function getFont(font) {
  return font[0]
    .replace('Noto Sans', 'serif')
    .replace('Roboto', 'sans-serif');
}

function loadStyles() {
  const styleUrl = 'https://api.maptiler.com/maps/topo/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB';
  fetch(styleUrl).then(data => data.json()).then(styleJson => {
    const spriteUrl = styleJson.sprite + (pixelRatio > 1 ? '@2x' : '') + '.json';
    const spriteImageUrl = styleJson.sprite + (pixelRatio > 1 ? '@2x' : '') + '.png';
    fetch(spriteUrl).then(data => data.json()).then(spriteJson => {
      styleFunction(landcover, styleJson, 'landcover', undefined, spriteJson, spriteImageUrl, getFont);
      styleFunction(contours, styleJson, 'contours', undefined, spriteJson, spriteImageUrl, getFont);
      styleFunction(openmaptiles, styleJson, 'openmaptiles', undefined, spriteJson, spriteImageUrl, getFont);
    });
  });
}

const tileQueue = new TileQueue(getTilePriority, () => {
  worker.postMessage({action: 'request-render'});
});
const maxTotalLoading = 8;
const maxNewLoads = 2;

let rendering = false;

worker.addEventListener('message', event => {
  if (event.data.action !== 'render') {
    return;
  }
  frameState = event.data.frameState;
  if (!pixelRatio) {
    pixelRatio = frameState.pixelRatio;
    loadStyles();
  }
  frameState.tileQueue = tileQueue;
  frameState.viewState.projection.__proto__ = Projection.prototype;
  if (rendering) {
    return;
  }
  rendering = true;
  requestAnimationFrame(function() {
    let rendered = false;
    layers.forEach(layer => {
      if (inView(layer.getLayerState(), frameState.viewState)) {
        rendered = true;
        const renderer = layer.getRenderer();
        renderer.renderFrame(frameState, canvas);
      }
    });
    rendering = false;
    if (!rendered) {
      return;
    }
    renderDeclutterItems(frameState, null);
    if (tileQueue.getTilesLoading() < maxTotalLoading) {
      tileQueue.reprioritize(); // FIXME only call if view has changed
      tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
    }
    const imageData = canvas.transferToImageBitmap();
    worker.postMessage({
      action: 'rendered',
      imageData: imageData,
      transform: rendererTransform,
      frameState: JSON.parse(JSON.stringify(frameState, getCircularReplacer()))
    }, [imageData]);
  });
});

