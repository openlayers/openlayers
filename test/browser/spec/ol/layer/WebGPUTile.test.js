import {assert} from 'chai';
import {WEBGPU} from '../../../../../src/ol/has.js';
import WebGPUTileLayer from '../../../../../src/ol/layer/WebGPUTile.js';
import WebGPUTileLayerRenderer from '../../../../../src/ol/renderer/webgpu/TileLayer.js';
import OSM from '../../../../../src/ol/source/OSM.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';
import {getKey as getTileCoordKey} from '../../../../../src/ol/tilecoord.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol/layer/WebGPUTile', () => {
  it('creates a WebGPU tile renderer', function () {
    if (!WEBGPU) {
      this.skip();
    }
    const layer = new WebGPUTileLayer({
      source: new OSM(),
    });
    const renderer = layer.createRenderer();
    assert.instanceOf(renderer, WebGPUTileLayerRenderer);
    layer.dispose();
  });

  it('finds cached parent tiles when the target zoom is not ready', () => {
    const source = new XYZ({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    const layer = new WebGPUTileLayer({source});
    const renderer = /** @type {WebGPUTileLayerRenderer} */ (
      layer.createRenderer()
    );
    const parentCoord = [1, 0, 0];
    const parentRep = {
      ready: true,
      texture: {},
      tile: {tileCoord: parentCoord},
    };
    const cacheKey = `${getUid(source)},${source.getKey()},${getTileCoordKey(parentCoord)}`;
    renderer.tileRepresentationCache.set(cacheKey, parentRep);

    const lookup = {tileIds: new Set(), representationsByZ: {}};
    const tileGrid = source.getTileGrid();
    assert.isOk(tileGrid);
    const covered = renderer.findAltTiles_(tileGrid, [2, 0, 0], 1, lookup);
    assert.isTrue(covered);
    assert.strictEqual(lookup.representationsByZ[1].has(parentRep), true);

    const emptyLookup = {tileIds: new Set(), representationsByZ: {}};
    const uncovered = renderer.findAltTiles_(
      tileGrid,
      [2, 2, 2],
      1,
      emptyLookup,
    );
    assert.isFalse(uncovered);

    const extentLookup = {tileIds: new Set(), representationsByZ: {}};
    const childExtent = tileGrid.getTileCoordExtent([2, 0, 0]);
    renderer.addCachedTilesAtZ_(tileGrid, source, 1, childExtent, extentLookup);
    assert.strictEqual(extentLookup.representationsByZ[1].has(parentRep), true);

    layer.dispose();
  });

  it('stops watching loading sources that a frame no longer uses', () => {
    const first = new XYZ({url: 'https://example.com/a/{z}/{x}/{y}.png'});
    const second = new XYZ({url: 'https://example.com/b/{z}/{x}/{y}.png'});
    first.setState('loading');
    second.setState('loading');
    let current = [first];
    const layer = new WebGPUTileLayer({sources: () => current});
    const renderer = /** @type {WebGPUTileLayerRenderer} */ (
      layer.getRenderer()
    );
    const frameState = /** @type {any} */ ({
      extent: [0, 0, 1, 1],
      viewState: {resolution: 1},
    });

    renderer.collectFrameSources_(frameState);
    assert.lengthOf(first.getListeners('change'), 1);

    current = [second];
    renderer.collectFrameSources_(frameState);
    assert.isUndefined(first.getListeners('change'));
    assert.lengthOf(second.getListeners('change'), 1);

    second.setState('error');
    assert.lengthOf(second.getListeners('change'), 1);

    layer.dispose();
    assert.isUndefined(second.getListeners('change'));
  });

  it('renders again and stops watching once a loading source is ready', () => {
    const source = new XYZ({url: 'https://example.com/{z}/{x}/{y}.png'});
    source.setState('loading');
    const layer = new WebGPUTileLayer({sources: [source]});
    const renderer = /** @type {WebGPUTileLayerRenderer} */ (
      layer.createRenderer()
    );
    renderer.collectFrameSources_(
      /** @type {any} */ ({extent: [0, 0, 1, 1], viewState: {resolution: 1}}),
    );
    const revision = layer.getRevision();

    source.setState('ready');
    assert.isAbove(layer.getRevision(), revision);
    assert.isUndefined(source.getListeners('change'));

    layer.dispose();
  });
});
