import TileQueue from '../../../../../../src/ol/TileQueue.js';
import TileState from '../../../../../../src/ol/TileState.js';
import WebGLTileLayer from '../../../../../../src/ol/layer/WebGLTile.js';
import {DataTile} from '../../../../../../src/ol/source.js';
import {VOID} from '../../../../../../src/ol/functions.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import {get} from '../../../../../../src/ol/proj.js';

describe('ol.renderer.webgl.TileLayer', function () {
  /** @type {import("../../../../../../src/ol/renderer/webgl/TileLayer.js").default} */
  let renderer;
  /** @type {WebGLTileLayer} */
  let tileLayer;
  /** @type {import('../../../../../../src/ol/PluggableMap.js').FrameState} */
  let frameState;
  beforeEach(function () {
    const size = 256;
    const context = createCanvasContext2D(size, size);

    tileLayer = new WebGLTileLayer({
      source: new DataTile({
        loader: function (z, x, y) {
          context.clearRect(0, 0, size, size);
          context.fillStyle = 'rgba(100, 100, 100, 0.5)';
          context.fillRect(0, 0, size, size);
          const data = context.getImageData(0, 0, size, size).data;
          return Promise.resolve(data);
        },
      }),
    });

    renderer = tileLayer.createRenderer();

    const proj = get('EPSG:3857');
    frameState = {
      layerStatesArray: [tileLayer.getLayerState()],
      layerIndex: 0,
      extent: proj.getExtent(),
      pixelRatio: 1,
      pixelToCoordinateTransform: create(),
      postRenderFunctions: [],
      time: Date.now(),
      viewHints: [],
      viewState: {
        center: [0, 0],
        resolution: 156543.03392804097,
        projection: proj,
      },
      size: [256, 256],
      usedTiles: {},
      wantedTiles: {},
      tileQueue: new TileQueue(VOID, VOID),
    };
  });

  it('maintains a cache on the renderer instead of the source', function () {
    expect(tileLayer.getSource().tileCache.highWaterMark).to.be(0.1);
    expect(renderer.tileTextureCache_.highWaterMark).to.be(512);
  });

  it('#prepareFrame()', function () {
    const source = tileLayer.getSource();
    tileLayer.setSource(null);
    expect(renderer.prepareFrame(frameState)).to.be(false);
    tileLayer.setSource(source);
    expect(renderer.prepareFrame(frameState)).to.be(true);
    const tileGrid = source.getTileGrid();
    tileLayer.setExtent(tileGrid.getTileCoordExtent([2, 0, 0]));
    frameState.resolution = tileGrid.getResolution(2);
    frameState.extent = tileGrid.getTileCoordExtent([2, 2, 2]);
    frameState.layerStatesArray = [tileLayer.getLayerState()];
    expect(renderer.prepareFrame(frameState)).to.be(false);
  });

  it('#renderFrame()', function () {
    const rendered = renderer.renderFrame(frameState);
    expect(rendered).to.be.a(HTMLCanvasElement);
    expect(frameState.tileQueue.getCount()).to.be(1);
    expect(Object.keys(frameState.wantedTiles).length).to.be(1);
    expect(frameState.postRenderFunctions.length).to.be(1); // clear source cache (use renderer cache)
    expect(renderer.tileTextureCache_.count_).to.be(1);
  });

  it('#isDrawableTile()', function (done) {
    const tile = tileLayer.getSource().getTile(0, 0, 0);
    expect(renderer.isDrawableTile(tile)).to.be(false);
    tileLayer.getSource().on('tileloadend', () => {
      expect(renderer.isDrawableTile(tile)).to.be(true);
      done();
    });
    tile.load();
    const errorTile = tileLayer.getSource().getTile(1, 0, 1);
    errorTile.setState(TileState.ERROR);
    tileLayer.setUseInterimTilesOnError(false);
    expect(renderer.isDrawableTile(errorTile)).to.be(true);
    tileLayer.setUseInterimTilesOnError(true);
    expect(renderer.isDrawableTile(errorTile)).to.be(false);
  });
});
