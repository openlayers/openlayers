import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import WebGPUVectorTileLayer from '../../../../../../src/ol/layer/WebGPUVectorTile.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import VectorTileSource from '../../../../../../src/ol/source/VectorTile.js';
import CircleStyle from '../../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../../src/ol/style/Fill.js';
import Style from '../../../../../../src/ol/style/Style.js';
import {getCacheKey} from '../../../../../../src/ol/tilecoord.js';
import {createXYZ, wrapX} from '../../../../../../src/ol/tilegrid.js';
import TileState from '../../../../../../src/ol/TileState.js';
import ViewHint from '../../../../../../src/ol/ViewHint.js';

/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {import('../../../../../../src/ol/VectorRenderTile.js').default} Idle tile.
 */
function idleTile(z, x, y) {
  return /** @type {any} */ ({
    tileCoord: [z, x, y],
    key: `${z}/${x}/${y}`,
    getState() {
      return TileState.IDLE;
    },
    getKey() {
      return `${z}/${x}/${y}`;
    },
    getSourceTiles() {
      return [];
    },
  });
}

/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {import('../../../../../../src/ol/VectorRenderTile.js').default} Loaded tile.
 */
function loadedTile(z, x, y) {
  return /** @type {any} */ ({
    tileCoord: [z, x, y],
    wrappedTileCoord: [z, x, y],
    key: `${z}/${x}/${y}`,
    getState() {
      return TileState.LOADED;
    },
    getKey() {
      return `${z}/${x}/${y}`;
    },
    getSourceTiles() {
      return [
        {
          getState() {
            return TileState.LOADED;
          },
          getFeatures() {
            return [new Feature(new Point([0, 0]))];
          },
        },
      ];
    },
  });
}

describe('ol/renderer/webgpu/VectorTileLayer', () => {
  /** @type {import('../../../../../../src/ol/proj/Projection.js').default} */
  let projection;
  /** @type {VectorTileSource} */
  let source;
  /** @type {WebGPUVectorTileLayer} */
  let layer;
  /** @type {import('../../../../../../src/ol/renderer/webgpu/VectorTileLayer.js').default} */
  let renderer;

  beforeEach(() => {
    projection =
      /** @type {import('../../../../../../src/ol/proj/Projection.js').default} */ (
        getProjection('EPSG:3857')
      );
    source = new VectorTileSource({
      url: '{z}/{x}/{y}.pbf',
      projection,
    });
    layer = new WebGPUVectorTileLayer({
      source,
      style: {
        'circle-radius': 2,
        'circle-fill-color': '#000',
      },
    });
    renderer = layer.createRenderer();
  });

  afterEach(() => {
    layer.dispose();
  });

  /**
   * @param {number} z Zoom.
   * @return {import('../../../../../../src/ol/Map.js').FrameState} Frame.
   */
  function frameAtZ(z) {
    const tileGrid = source.getTileGridForProjection(projection);
    return /** @type {any} */ ({
      extent: tileGrid.getTileCoordExtent([0, 0, 0]),
      pixelRatio: 1,
      wantedTiles: {},
      viewHints: [0, 0],
      tileQueue: {
        isKeyQueued: () => false,
        enqueue: () => {},
      },
      viewState: {
        projection,
        resolution: tileGrid.getResolution(z),
        center: [0, 0],
      },
    });
  }

  /**
   * Tessellation is handed to a worker, so a batch appears a frame or two after
   * the tile does.
   *
   * @param {import('../../../../../../src/ol/Map.js').FrameState} frameState Frame.
   * @param {number} expected Batches to wait for.
   * @return {Promise<Array<Object>>} Batches.
   */
  async function collectBatches(frameState, expected) {
    let batches = renderer.collectBatches_(frameState);
    for (let i = 0; i < 200 && batches.length < expected; ++i) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      batches = renderer.collectBatches_(frameState);
    }
    return batches;
  }

  it('draws cached parent tiles while current zoom tiles are loading', async () => {
    const requested = [];
    source.getTile = function (z, x, y) {
      requested.push([z, x, y]);
      return idleTile(z, x, y);
    };
    const sourceKey = source.getKey();
    renderer.renderTiles_.set(
      getCacheKey(source, sourceKey, 0, 0, 0),
      loadedTile(0, 0, 0),
    );

    const batches = await collectBatches(frameAtZ(1), 1);

    assert.strictEqual(batches.length, 1);
    assert.match(batches[0].key, /^0\/0\/0\//);
    assert.isFalse(requested.some((coord) => coord[0] === 0));
    assert.isNotEmpty(requested);
  });

  it('clips cached parents to holes between loaded current tiles', async () => {
    source.getTile = function (z, x, y) {
      return z === 1 && x === 0 && y === 0
        ? loadedTile(z, x, y)
        : idleTile(z, x, y);
    };
    const sourceKey = source.getKey();
    renderer.renderTiles_.set(
      getCacheKey(source, sourceKey, 0, 0, 0),
      loadedTile(0, 0, 0),
    );
    const frameState = frameAtZ(1);
    frameState.index = 1;

    const batches = await collectBatches(frameState, 2);

    const tileGrid = source.getTileGridForProjection(projection);
    const current = batches.find((batch) => /^1\/0\/0\//.test(batch.key));
    const fallback = batches.find((batch) => /^0\/0\/0\//.test(batch.key));
    assert.deepEqual(current.geometryClipExtents, [
      tileGrid.getTileCoordExtent([1, 0, 0]),
    ]);
    assert.deepEqual(fallback.geometryClipExtents, [
      tileGrid.getTileCoordExtent([1, 0, 1]),
      tileGrid.getTileCoordExtent([1, 1, 0]),
      tileGrid.getTileCoordExtent([1, 1, 1]),
    ]);
  });

  it('draws cached child tiles when zooming out before parent tiles load', async () => {
    source.getTile = function (z, x, y) {
      return idleTile(z, x, y);
    };
    const sourceKey = source.getKey();
    for (let x = 0; x <= 1; ++x) {
      for (let y = 0; y <= 1; ++y) {
        renderer.renderTiles_.set(
          getCacheKey(source, sourceKey, 1, x, y),
          loadedTile(1, x, y),
        );
      }
    }

    const batches = await collectBatches(frameAtZ(0), 4);

    assert.strictEqual(batches.length, 4);
    const coords = batches
      .map((batch) => batch.key.split('/').slice(0, 3).join('/'))
      .sort();
    assert.deepEqual(coords, ['1/0/0', '1/0/1', '1/1/0', '1/1/1']);
  });

  it('reuses bounded source subdivisions across deeper overzoom tiles', async () => {
    layer.dispose();
    const sourceGrid = createXYZ({maxZoom: 0});
    source = new VectorTileSource({
      tileGrid: sourceGrid,
      projection,
      url: '{z}/{x}/{y}.pbf',
    });
    const sourceTile = /** @type {any} */ ({
      tileCoord: [0, 0, 0],
      extent: sourceGrid.getTileCoordExtent([0, 0, 0]),
      getKey() {
        return 'source/0/0/0';
      },
      getState() {
        return TileState.LOADED;
      },
      getFeatures() {
        return [new Feature(new Point([0, 0]))];
      },
    });
    source.getTile = function (z, x, y) {
      const tile = loadedTile(z, x, y);
      tile.getSourceTiles = () => [sourceTile];
      return tile;
    };
    layer = new WebGPUVectorTileLayer({
      source,
      style: {
        'circle-radius': 2,
        'circle-fill-color': '#000',
      },
    });
    renderer = layer.createRenderer();

    const frameAtOne = frameAtZ(1);
    frameAtOne.index = 1;
    const frameAtTwo = frameAtZ(2);
    frameAtTwo.index = 2;
    const batchesAtOne = await collectBatches(frameAtOne, 4);
    const batchesAtTwo = await collectBatches(frameAtTwo, 4);

    assert.strictEqual(batchesAtOne.length, 4);
    assert.strictEqual(batchesAtTwo.length, 4);
    assert.isTrue(batchesAtOne.every((batch) => /^source\//.test(batch.key)));
    assert.isTrue(batchesAtTwo.every((batch) => /^source\//.test(batch.key)));
    assert.deepEqual(
      batchesAtTwo.map((batch) => batch.geometryClipExtents.length),
      [4, 4, 4, 4],
    );
  });

  it('filters original geometries before evaluating function styles', async () => {
    layer.dispose();
    const sourceGrid = createXYZ({maxZoom: 0});
    source = new VectorTileSource({
      tileGrid: sourceGrid,
      projection,
      url: '{z}/{x}/{y}.pbf',
    });
    const tileGrid = source.getTileGridForProjection(projection);
    const renderCoord = [2, 0, 0];
    const batchExtent = tileGrid.getTileCoordExtent([1, 0, 0]);
    const resolution = tileGrid.getResolution(renderCoord[0]);
    const center = [
      (batchExtent[0] + batchExtent[2]) / 2,
      (batchExtent[1] + batchExtent[3]) / 2,
    ];
    const inside = new Feature(new Point(center));
    inside.setId('inside');
    const buffered = new Feature(
      new Point([batchExtent[2] + 50 * resolution, center[1]]),
    );
    buffered.setId('buffered');
    const alternateOutside = new Feature(
      new Point([center[0], center[1] + resolution]),
    );
    alternateOutside.setId('alternate-outside');
    alternateOutside.set(
      'draw',
      new Point([batchExtent[2] + 200 * resolution, center[1]]),
    );
    const originalOutside = new Feature(
      new Point([batchExtent[2] + 200 * resolution, center[1] + resolution]),
    );
    originalOutside.setId('original-outside');
    originalOutside.set('draw', new Point(center));
    const features = [inside, buffered, alternateOutside, originalOutside];
    const sourceTile = /** @type {any} */ ({
      tileCoord: [0, 0, 0],
      projection,
      getKey: () => 'source/0/0/0',
      getState: () => TileState.LOADED,
      getFeatures: () => features,
    });
    const renderTile = loadedTile(...renderCoord);
    renderTile.getSourceTiles = () => [sourceTile];
    const calls = [];
    const image = new CircleStyle({
      radius: 3,
      fill: new Fill({color: '#000'}),
    });
    layer = new WebGPUVectorTileLayer({
      source,
      style: (feature) => {
        calls.push(feature.getId());
        return new Style({
          geometry: feature.get('draw') || feature.getGeometry(),
          image,
        });
      },
    });
    renderer = layer.createRenderer();

    let batch = null;
    for (let i = 0; i < 200 && !batch; ++i) {
      renderer.batchBuildBudget_ = 1;
      renderer.batchBuildDeadline_ = Infinity;
      batch = renderer.getBatch_(
        renderTile,
        renderCoord,
        {
          projection,
          resolution,
          zoom: renderCoord[0],
          center,
        },
        1,
      );
      if (!batch) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    assert.sameMembers(calls, ['inside', 'buffered', 'alternate-outside']);
    assert.lengthOf(batch.buffers.labels, 2);
    assert.deepEqual(
      batch.buffers.labels.map((label) => label._anchor),
      [center, [batchExtent[2] + 50 * resolution, center[1]]],
    );
  });

  it('admits one batch preparation while the view is moving', async () => {
    source.getTile = function (z, x, y) {
      return loadedTile(z, x, y);
    };
    const frameState = frameAtZ(0);
    frameState.viewHints[ViewHint.ANIMATING] = 1;

    renderer.collectBatches_(frameState);
    assert.strictEqual(renderer.pendingKeys_.size, 1);

    frameState.viewHints[ViewHint.ANIMATING] = 0;
    const batches = await collectBatches(frameState, 1);
    assert.strictEqual(batches.length, 1);
  });

  it('restyles tiles at the view resolution once the view settles', async () => {
    layer.dispose();
    const features = [new Feature(new Point([0, 0]))];
    const sourceTiles = [
      {
        getState: () => TileState.LOADED,
        getFeatures: () => features,
      },
    ];
    source.getTile = function (z, x, y) {
      const tile = loadedTile(z, x, y);
      tile.getSourceTiles = () => sourceTiles;
      return tile;
    };
    const resolutions = [];
    const image = new CircleStyle({
      radius: 3,
      fill: new Fill({color: '#000'}),
    });
    layer = new WebGPUVectorTileLayer({
      source,
      style: (feature, resolution) => {
        resolutions.push(resolution);
        return new Style({image});
      },
    });
    renderer = layer.createRenderer();
    const frameState = frameAtZ(0);
    const builtKey = (await collectBatches(frameState, 1))[0].key;

    const settledResolution = frameState.viewState.resolution * 0.8;
    frameState.viewState.resolution = settledResolution;
    frameState.viewHints[ViewHint.INTERACTING] = 1;
    assert.strictEqual(renderer.collectBatches_(frameState)[0].key, builtKey);
    assert.notInclude(resolutions, settledResolution);

    frameState.viewHints[ViewHint.INTERACTING] = 0;
    assert.strictEqual(renderer.collectBatches_(frameState)[0].key, builtKey);
    let key = builtKey;
    for (let i = 0; i < 200 && key === builtKey; ++i) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      key = renderer.collectBatches_(frameState)[0].key;
    }
    assert.notStrictEqual(key, builtKey);
    assert.include(resolutions, settledResolution);
  });

  it('prepares the tile nearest the view center first', () => {
    source.getTile = function (z, x, y) {
      return loadedTile(z, x, y);
    };
    const frameState = frameAtZ(1);
    const tileGrid = source.getTileGridForProjection(projection);
    frameState.viewState.center = tileGrid.getTileCoordCenter([1, 0, 0]);

    renderer.collectBatches_(frameState);

    assert.match(Array.from(renderer.pendingKeys_)[0], /^1\/0\/0\//);
  });

  it('offsets geometry of tiles repeated across the antimeridian', async () => {
    const tileGrid = source.getTileGridForProjection(projection);
    const worldExtent = tileGrid.getExtent();
    const worldWidth = worldExtent[2] - worldExtent[0];
    source.getTile = function (z, x, y) {
      const tile = loadedTile(z, x, y);
      tile.wrappedTileCoord = wrapX(tileGrid, [z, x, y], projection);
      return tile;
    };

    const frameState = /** @type {any} */ ({
      extent: [
        worldExtent[0] - worldWidth * 0.25,
        worldExtent[1],
        worldExtent[2],
        worldExtent[3],
      ],
      pixelRatio: 1,
      wantedTiles: {},
      viewHints: [0, 0],
      tileQueue: {
        isKeyQueued: () => false,
        enqueue: () => {},
      },
      viewState: {
        projection,
        resolution: tileGrid.getResolution(0),
        center: [worldExtent[0], 0],
      },
    });
    const batches = await collectBatches(frameState, 2);

    const offsets = batches.map((batch) => batch.worldOffset);
    assert.isTrue(offsets.some((offset) => Math.abs(offset) < 1e-6));
    assert.isTrue(
      offsets.some((offset) => Math.abs(offset + worldWidth) < 1e-3),
    );
  });

  it('rasterizes glyphs again and rebuilds when fonts change', () => {
    const glyph = renderer.atlas_.getGlyph('12px sans-serif', 'A');
    const revision = layer.getRevision();
    renderer.handleFontsChanged();
    assert.isAbove(layer.getRevision(), revision);
    assert.notStrictEqual(
      renderer.atlas_.getGlyph('12px sans-serif', 'A'),
      glyph,
    );
  });

  it('does not keep labels of disposed batches for fading', () => {
    renderer.renderedBatches_ = [
      {isDisposed: () => true, labelIdentities: [1]},
    ];
    renderer.updateRetiredBatches_([], 0);
    assert.lengthOf(renderer.retiredBatches_, 0);
  });

  it('starts the font atlas over when the view is idle', () => {
    const atlas = renderer.atlas_;
    for (let i = 0; atlas.getPageCount() < 4; ++i) {
      atlas.getGlyph('1800px sans-serif', String(i));
    }
    renderer.declutterBatches_ = [{atlasPages: [2]}];
    const revision = layer.getRevision();
    const frameState = frameAtZ(0);
    frameState.viewHints = [0, 1];
    renderer.prepareFrameInternal(frameState);
    assert.strictEqual(atlas.getPageCount(), 4);
    frameState.viewHints = [0, 0];
    renderer.prepareFrameInternal(frameState);
    assert.strictEqual(atlas.getPageCount(), 1);
    assert.isAbove(layer.getRevision(), revision);
  });

  it('drops references to a batch when it is disposed', () => {
    const batch = {references: []};
    const newer = {references: []};
    renderer.setBatchReference_(renderer.renderBatchesByKey_, 'a', batch);
    renderer.setBatchReference_(renderer.renderBatchesByKey_, 'b', batch);
    renderer.setBatchReference_(renderer.renderBatchesByKey_, 'b', newer);
    renderer.retiredBatches_ = [{batch, until: Infinity}];
    renderer.handleBatchDispose_(batch);
    assert.isFalse(renderer.renderBatchesByKey_.has('a'));
    assert.strictEqual(renderer.renderBatchesByKey_.get('b'), newer);
    assert.lengthOf(renderer.retiredBatches_, 0);
  });
});
