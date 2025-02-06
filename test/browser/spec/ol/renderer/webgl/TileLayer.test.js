import Map from '../../../../../../src/ol/Map.js';
import TileQueue from '../../../../../../src/ol/TileQueue.js';
import View from '../../../../../../src/ol/View.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import {VOID} from '../../../../../../src/ol/functions.js';
import WebGLTileLayer from '../../../../../../src/ol/layer/WebGLTile.js';
import {get} from '../../../../../../src/ol/proj.js';
import {newTileRepresentationLookup} from '../../../../../../src/ol/renderer/webgl/TileLayerBase.js';
import DataTile from '../../../../../../src/ol/source/DataTile.js';
import {create} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';
import TileTexture from '../../../../../../src/ol/webgl/TileTexture.js';

describe('ol/renderer/webgl/TileLayer', function () {
  /** @type {import("../../../../../../src/ol/renderer/webgl/TileLayer.js").default} */
  let renderer;
  /** @type {WebGLTileLayer} */
  let tileLayer;
  /** @type {import('../../../../../../src/ol/Map.js').FrameState} */
  let frameState;
  /** @type {Map} */
  let map;
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
          return data;
        },
      }),
    });

    renderer = tileLayer.getRenderer();

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
      renderTargets: {},
    };

    map = new Map({
      view: new View(),
    });
    tileLayer.set('map', map, true);
  });

  afterEach(function () {
    tileLayer.dispose();
    map.dispose();
  });

  it('maintains a cache on the renderer', function () {
    expect(renderer.tileRepresentationCache.highWaterMark).to.be(512);
  });

  it('#prepareFrame()', function () {
    const source = tileLayer.getSource();
    tileLayer.setSource(null);
    expect(renderer.prepareFrame(frameState)).to.be(false);
    tileLayer.setSource(source);
    renderer = tileLayer.getRenderer();
    expect(renderer.prepareFrame(frameState)).to.be(true);
    const tileGrid = source.getTileGrid();
    tileLayer.setExtent(tileGrid.getTileCoordExtent([2, 0, 0]));
    frameState.resolution = tileGrid.getResolution(2);
    frameState.extent = tileGrid.getTileCoordExtent([2, 2, 2]);
    frameState.layerStatesArray = [tileLayer.getLayerState()];
    expect(renderer.prepareFrame(frameState)).to.be(false);
  });

  it('#renderFrame()', function () {
    const ready = renderer.prepareFrame(frameState);
    expect(ready).to.be(true);

    const rendered = renderer.renderFrame(frameState);
    expect(rendered).to.be.a(HTMLCanvasElement);
    expect(frameState.tileQueue.getCount()).to.be(1);
    expect(Object.keys(frameState.wantedTiles).length).to.be(1);
    expect(renderer.tileRepresentationCache.count_).to.be(1);
  });

  describe('enqueueTiles()', () => {
    it('enqueues tiles at a single zoom level (preload: 0)', () => {
      renderer.prepareFrame(frameState);
      const extent = [-1, -1, 1, 1];
      renderer.enqueueTiles(
        frameState,
        extent,
        10,
        newTileRepresentationLookup(),
        tileLayer.getPreload(),
      );

      const source = tileLayer.getSource();
      const sourceKey = getUid(source);
      expect(frameState.wantedTiles[sourceKey]).to.be.an(Object);

      const wantedTiles = frameState.wantedTiles[sourceKey];

      const expected = {
        [sourceKey + '/10,511,511']: true,
        [sourceKey + '/10,511,512']: true,
        [sourceKey + '/10,512,511']: true,
        [sourceKey + '/10,512,512']: true,
      };
      expect(wantedTiles).to.eql(expected);
    });

    it('enqueues tiles at multiple zoom levels (preload: 2)', () => {
      tileLayer.setPreload(2);
      renderer.prepareFrame(frameState);
      const extent = [-1, -1, 1, 1];
      renderer.enqueueTiles(
        frameState,
        extent,
        10,
        newTileRepresentationLookup(),
        tileLayer.getPreload(),
      );

      const source = tileLayer.getSource();
      const sourceKey = getUid(source);
      expect(frameState.wantedTiles[sourceKey]).to.be.an(Object);

      const wantedTiles = frameState.wantedTiles[sourceKey];

      const expected = {
        [sourceKey + '/10,511,511']: true,
        [sourceKey + '/10,511,512']: true,
        [sourceKey + '/10,512,511']: true,
        [sourceKey + '/10,512,512']: true,
        [sourceKey + '/9,255,255']: true,
        [sourceKey + '/9,255,256']: true,
        [sourceKey + '/9,256,255']: true,
        [sourceKey + '/9,256,256']: true,
        [sourceKey + '/8,127,127']: true,
        [sourceKey + '/8,127,128']: true,
        [sourceKey + '/8,128,127']: true,
        [sourceKey + '/8,128,128']: true,
      };
      expect(wantedTiles).to.eql(expected);
    });

    it('does not go below layer min zoom', () => {
      tileLayer.setPreload(Infinity);
      tileLayer.setMinZoom(9);
      renderer.prepareFrame(frameState);
      const extent = [-1, -1, 1, 1];
      renderer.enqueueTiles(
        frameState,
        extent,
        10,
        newTileRepresentationLookup(),
        tileLayer.getPreload(),
      );

      const source = tileLayer.getSource();
      const sourceKey = getUid(source);
      expect(frameState.wantedTiles[sourceKey]).to.be.an(Object);

      const wantedTiles = frameState.wantedTiles[sourceKey];

      const expected = {
        [sourceKey + '/10,511,511']: true,
        [sourceKey + '/10,511,512']: true,
        [sourceKey + '/10,512,511']: true,
        [sourceKey + '/10,512,512']: true,
        [sourceKey + '/9,255,255']: true,
        [sourceKey + '/9,255,256']: true,
        [sourceKey + '/9,256,255']: true,
        [sourceKey + '/9,256,256']: true,
      };
      expect(wantedTiles).to.eql(expected);
    });

    it('layer min zoom relates to view zoom levels', () => {
      map.setView(
        new View({maxResolution: map.getView().getMaxResolution() * 2}),
      );
      tileLayer.setPreload(Infinity);
      tileLayer.setMinZoom(9);
      renderer.prepareFrame(frameState);
      const extent = [-1, -1, 1, 1];
      renderer.enqueueTiles(
        frameState,
        extent,
        10,
        newTileRepresentationLookup(),
        tileLayer.getPreload(),
      );

      const source = tileLayer.getSource();
      const sourceKey = getUid(source);
      expect(frameState.wantedTiles[sourceKey]).to.be.an(Object);

      const wantedTiles = frameState.wantedTiles[sourceKey];

      const expected = {
        [sourceKey + '/10,511,511']: true,
        [sourceKey + '/10,511,512']: true,
        [sourceKey + '/10,512,511']: true,
        [sourceKey + '/10,512,512']: true,
        [sourceKey + '/9,255,255']: true,
        [sourceKey + '/9,255,256']: true,
        [sourceKey + '/9,256,255']: true,
        [sourceKey + '/9,256,256']: true,
        [sourceKey + '/8,127,127']: true,
        [sourceKey + '/8,127,128']: true,
        [sourceKey + '/8,128,127']: true,
        [sourceKey + '/8,128,128']: true,
      };
      expect(wantedTiles).to.eql(expected);
    });

    it('skips tiles not in the rotated viewport', () => {
      const z = 10;
      const resolution = map.getView().getResolutionForZoom(z);
      frameState.viewState.resolution = resolution;
      frameState.viewState.rotation = Math.PI / 4;
      const extent = [
        -frameState.size[0],
        -frameState.size[1],
        frameState.size[0],
        frameState.size[1],
      ].map((c) => c * resolution * Math.SQRT2);

      renderer.prepareFrame(frameState);
      renderer.enqueueTiles(
        frameState,
        extent,
        z,
        newTileRepresentationLookup(),
        tileLayer.getPreload(),
      );

      const source = tileLayer.getSource();
      const sourceKey = getUid(source);
      expect(frameState.wantedTiles[sourceKey]).to.be.an(Object);

      const wantedTiles = frameState.wantedTiles[sourceKey];

      const expected = {
        [sourceKey + '/10,511,511']: true,
        [sourceKey + '/10,511,512']: true,
        [sourceKey + '/10,512,511']: true,
        [sourceKey + '/10,512,512']: true,
      };
      expect(wantedTiles).to.eql(expected);
    });
  });

  describe('#createTileRepresentation', () => {
    let tileRepresentation;
    beforeEach(() => {
      const source = tileLayer.getSource();
      const grid = source.getTileGrid();
      const tile = source.getTile(0, 0, 0);
      renderer.prepareFrame(frameState);
      tileRepresentation = renderer.createTileRepresentation({
        tile,
        grid,
        helper: renderer.helper,
        gutter: 4,
      });
    });
    it('creates a TileTexture instance', () => {
      expect(tileRepresentation).to.be.a(TileTexture);
    });
  });
});
