import {getUid} from '../src/ol/util.js';

import CanvasVectorTileLayerRenderer from '../src/ol/renderer/canvas/VectorTileLayer.js';
import {loadImageUsingDom} from '../src/ol/loadImage.js';
import TileState from '../src/ol/TileState.js';
import {listen} from '../src/ol/events.js';
import EventType from '../src/ol/events/EventType.js';
import ExecutorGroup from '../src/ol/render/canvas/ExecutorGroup.js';
import Executor from '../src/ol/render/canvas/Executor.js';

function resizeCanvas(canvas, img) {
  if (canvas.width !== img.width) {
    canvas.width = img.width;
  }
  if (canvas.height !== img.height) {
    canvas.height = img.height;
  }
}

function pushImage(canvas, img) {
  resizeCanvas(canvas, img);
  canvas.getContext('bitmaprenderer').transferFromImageBitmap(img);
  img.close();
}

/**
 * @classdesc
 * Canvas renderer for vector tile layers.
 * @api
 */
export default class CustomCanvasVectorTileLayerRenderer extends CanvasVectorTileLayerRenderer {

  /**
   * @param {import(".mapbox-vector-tiles-custom-worker-layer.js").default} layer CustomVectorTile layer.
   */
  constructor(layer) {
    super(layer);

    this.tilesByWorkerMessageId_ = {};
    this.currentWorkerMessageId_ = 0;

    this.worker_ = layer.getWorker();
    if (this.worker_) {
      this.worker_.addEventListener('message', this.onWorkerMessageReceived_.bind(this), false);
    }
  }

  logImage(bmp, txt) {
    const canvases = document.getElementById('canvases');
    const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const div = document.createElement('div');
    div.innerHTML = txt;
    canvases.appendChild(div);
    canvases.appendChild(canvas);
  }

  onWorkerMessageReceived_(event) {
    const {images, action, messageId, executorGroup} = event.data;
    if (action === 'preparedTile') {
      const tile = this.tilesByWorkerMessageId_[messageId];
      const pixelRatio = tile['pixelRatio'];
      const projection = tile['projection'];
      if (images.length > 0) {
        const image = images[0];
        const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
        tile.getContext(this.getLayer(), canvas.getContext('bitmaprenderer'));
        // this.logImage(image, tile.getTileCoord().toString());
        pushImage(canvas, image);
        tile['offscreencanvas'] = true;
      } else {
        tile['instructs'] = true;
      }
      const layerId = getUid(this.getLayer());
      executorGroup.forEach((g) => {
        g.__proto__ = ExecutorGroup.prototype;
        const executors = g.getExecutors();
        for (const key1 in executors) {
          const value1 = executors[key1];
          for (const key2 in value1) {
            const executor = value1[key2];
            executor.__proto__ = Executor.prototype;
          }
        }
      });
      this.updateExecutorGroup(tile, pixelRatio, projection);
      tile.executorGroups[layerId] = executorGroup;
      tile.hifi = true;
      tile.setState(TileState.LOADED);
    } else if (action === 'failedTilePreparation') {
      const tile = this.tilesByWorkerMessageId_[messageId];
      const state = event.data.state;
      tile.hifi = true;
      tile.setState(state);
    } else if (action === 'loadImage') {
      const {src, options, opaqueId} = event.data;
      const worker = this.worker_;
      loadImageUsingDom(src, options, function(domImage) {
        createImageBitmap(domImage).then(function(bmp) {
          worker.postMessage({
            action: 'continueWorkerImageLoading',
            opaqueId: opaqueId,
            image: bmp
          },
          [bmp]);
        });
      });
      return;
    }
    delete this.tilesByWorkerMessageId_[messageId];
    --this.tilesByWorkerMessageIdCount_;
  }

  /**
   * @param {number} z .
   * @param {number} x .
   * @param {number} y .
   * @param {number} pixelRatio .
   * @param {Projection} projection .
   * @param {any} opaqueTileId .
   * @param {function(Tile): any} successFn .
   * @param {function(): any} errorFn .
   * @param {boolean} stopAtInstructionsCreation .
   */
  prepareTileInWorker(z, x, y, pixelRatio, projection, opaqueTileId,
    successFn, errorFn, stopAtInstructionsCreation) {
    const tile = this.getTile(z, x, y, pixelRatio, projection);
    const state = tile.getState();
    if (state === TileState.LOADING) {
      // This case is very unlikely. In the main thread:
      // - there is a cache of tiles;
      // - a tile is not recreated as long as it is in that cache;
      // - loading tiles are likely to be in that cache
      self['console'].error('in worker getTile is loading, no luck', opaqueTileId, tile, state);
      self['console'].error('this case results in a never released pending request');
      errorFn();
      return;
    }

    const that = this;
    function listener() {
      try {
        const state = tile.getState();
        if (state === TileState.LOADED) {
          if (!stopAtInstructionsCreation) {
            that.renderTileImage(tile, pixelRatio, projection);
            if (!tile.hifi) {
              return;
            }
          }
          tile.removeEventListener('change', listener);
          successFn(tile);
        } else if (state === TileState.ERROR) {
          tile.removeEventListener('change', listener);
          errorFn(tile);
        }
      } catch (e) {
        self['console'].error('prepareTileInWorker catch error', opaqueTileId, state);
        tile.setState(TileState.ERROR);
      }
    }

    if (state >= TileState.LOADED) {
      // If the state was loaded, we want to draw again the tile because we transfer the tile
      // images to the main thread. Skipping the rendering would return a transparent tile
      // (see point 4 of the transferToImageBitmap spec). Instructions should be transfered too
      // so a similar issue will exist.
      // Ideally, there should be no "cache" in the web worker, eliminating the issue entirely.
      listener();
    } else {
      tile.addEventListener('change', listener);
    }

    tile.load();
  }

  /**
   * @inheritDoc
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tile = /** @type {import("../../VectorRenderTile.js").default} */ (super.getTile(z, x, y, pixelRatio, projection));
    const tileUid = getUid(tile);
    const worker = this.worker_;
    if (this.worker_) {
      if (tile.getState() === TileState.IDLE && !tile.hasOwnProperty('load')) {
        const tilesByWorkerMessageId = this.tilesByWorkerMessageId_;
        const messageId = ++this.currentWorkerMessageId_;
        tile['load'] = function() {
          if (tile.getState() === TileState.IDLE) {
            tile.setState(TileState.LOADING);
            tile['pixelRatio'] = pixelRatio;
            tile['projection'] = projection;
            const tileCoord = tile.getTileCoord();
            tilesByWorkerMessageId[messageId] = tile;
            const msg = {
              action: 'prepareTile',
              tileCoord: tileCoord,
              messageId: messageId,
              tileId: tileUid,
              pixelRatio: pixelRatio
            };
            worker.postMessage(msg);
          }
          return [];
        };
      }
    } else {
      if (tile.getState() < TileState.LOADED) {
        if (!(tileUid in this.tileListenerKeys_)) {
          const listenerKey = listen(tile, EventType.CHANGE, this.prepareTile.bind(this, tile, pixelRatio, projection));
          this.tileListenerKeys_[tileUid] = listenerKey;
        }
      } else {
        this.prepareTile(tile, pixelRatio, projection);
      }
    }
    return tile;
  }

}
