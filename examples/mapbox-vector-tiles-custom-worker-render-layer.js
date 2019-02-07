import {getUid} from '../src/ol/util.js';

import CanvasVectorTileLayerRenderer from '../src/ol/renderer/canvas/VectorTileLayer.js';
import {loadImageUsingDom} from '../src/ol/loadImage.js';
import TileState from '../src/ol/TileState.js';
import {listen} from '../src/ol/events.js';
import EventType from '../src/ol/events/EventType.js';

const dateByTile = {};

function resizeCanvas(canvas, img) {
  if (canvas.width !== img.width) {
    canvas.width = img.width;
  }
  if (canvas.height !== img.height) {
    canvas.height = img.height;
  }
}

function pushImage(canvas, img) {
  // Most efficient method
  resizeCanvas(canvas, img);
  canvas.getContext('bitmaprenderer').transferFromImageBitmap(img);
  img.close();
}

function log() {
  // console.log.call(null, arguments);
}

function error() {
  // console.error.call(null, arguments);
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

    this.currentWorkerMessageId_ = 0;
    this.tilesByWorkerMessageId_ = {};
    this.tilesByWorkerMessageIdCount_ = 0;

    this.worker_ = layer.getWorker();
    let previous = 0;
    const counter = () => {
      if (this.tilesByWorkerMessageIdCount_ !== previous) {
        log('count', this.tilesByWorkerMessageIdCount_, Object.values(this.tilesByWorkerMessageId_).map(tile => tile.ol_uid));
        previous = this.tilesByWorkerMessageIdCount_;
      }
      requestAnimationFrame(counter);
    };
    if (this.worker_) {
      counter();
      this.worker_.addEventListener('message', this.onWorkerMessageReceived_.bind(this), false);
    }
  }

  onWorkerMessageReceived_(event) {
    log('received event in main thread', event.data);
    const {images, action, messageId, tileId, executorGroup} = event.data;
    if (action === 'preparedTile') {
      const tile = this.tilesByWorkerMessageId_[messageId];
      const pixelRatio = tile['pixelRatio'];
      const projection = tile['projection'];
      const image = images[0];
      const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
      tile.getContext(this.getLayer(), canvas.getContext('bitmaprenderer'));
      pushImage(canvas, image);
      const layerId = getUid(this.getLayer());
      tile.executorGroups[layerId] = executorGroup;
      this.updateExecutorGroup_(tile, pixelRatio, projection);
      tile.hifi = true;
      log('main: setting loaded state', tileId);
      tile.setState(TileState.LOADED);
    } else if (action === 'failedTilePreparation') {
      const tile = this.tilesByWorkerMessageId_[messageId];
      const state = event.data.state;
      tile.hifi = true;
      tile.setState(state);
      log('Failed', messageId);
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
    delete dateByTile[messageId];
  }


  prepareTileInWorker(z, x, y, pixelRatio, projection, opaqueTileId) {
    const tile = this.getTile(z, x, y, pixelRatio, projection);
    const state = tile.getState();
    if (state === TileState.LOADING) {
      error('in worker getTile is loading, no luck', opaqueTileId, tile, state);
      error('this case results in a never released pending request');
    }
    if (state >= TileState.LOADED) {
      if (state !== TileState.LOADED) {
        error('in worker getTile already known', opaqueTileId, tile, state);
      }
      return new Promise(function(resolve, reject) {
        state === TileState.LOADED ? resolve(tile) : reject(tile);
      });
    }

    const that = this;
    const promise = new Promise(function(resolve, reject) {
      const listener = () => {
        try {
          const state = tile.getState();
          if (state === TileState.LOADED) {
            log('prepareTileInWorker loaded', opaqueTileId, state);
            that.renderTileImage_(tile, pixelRatio, projection);
            log('prepareTileInWorker loaded after renderTileImage', opaqueTileId, state);
            if (!tile.hifi) {
              log('tile', opaqueTileId, 'is not hifi: will not return it!');
              return;
            }
            tile.removeEventListener('change', listener);
            resolve(tile);
          } else if (state === TileState.ERROR) {
            error('prepareTileInWorker error', opaqueTileId, state);
            tile.removeEventListener('change', listener);
            reject(tile);
          } else {
            if (state > TileState.LOADED) {
              error('other state', opaqueTileId, state);
            }
          }
        } catch (e) {
          error('prepareTileInWorker catch error', opaqueTileId, state);
          tile.setState(TileState.ERROR);
        }
      };
      tile.addEventListener('change', listener);
    });
    tile.load();
    log('prepareTileInWorker after tile.load()', opaqueTileId, state);
    return promise;
  }

  /**
   * @inheritDoc
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tile = /** @type {import("../../VectorRenderTile.js").default} */ (super.getTile(z, x, y, pixelRatio, projection));
    const tileUid = getUid(tile);
    const worker = this.worker_;
    if (this.worker_) {
      if (tile.getState() === TileState.IDLE && !tile['HACK_DONE']) {
        const that = this;
        tile['load'] = function() {
          if (tile.getState() === TileState.IDLE) {
            const messageId = ++that.currentWorkerMessageId_;
            tile.setState(TileState.LOADING);
            tile['pixelRatio'] = pixelRatio;
            tile['projection'] = projection;
            const tileCoord = tile.getTileCoord();
            that.tilesByWorkerMessageId_[messageId] = tile;
            that.tilesByWorkerMessageIdCount_++;
            dateByTile[tileUid] = Date.now();
            const msg = {
              action: 'prepareTile',
              tileCoord: tileCoord,
              messageId: messageId,
              tileId: tileUid,
              pixelRatio: pixelRatio
            };
            log('Sending prepareTile to worker', msg);
            worker.postMessage(msg);
          }
          return [];
        };
        tile['HACK_DONE'] = true;
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
