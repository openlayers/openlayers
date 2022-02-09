import DataTile from '../../../../../src/ol/DataTile.js';
import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import ImageTile from '../../../../../src/ol/ImageTile.js';
import TileState from '../../../../../src/ol/TileState.js';
import TileTexture from '../../../../../src/ol/webgl/TileTexture.js';
import WebGLArrayBuffer from '../../../../../src/ol/webgl/Buffer.js';
import WebGLTileLayer from '../../../../../src/ol/layer/WebGLTile.js';
import {EXTENT as EPSG3857_EXTENT} from '../../../../../src/ol/proj/epsg3857.js';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

describe('ol/webgl/TileTexture', function () {
  /** @type {TileTexture} */
  let tileTexture;

  /** @type {import("../../../../../src/ol/renderer/webgl/TileLayer.js").default} */
  let renderer;

  beforeEach(function () {
    const layer = new WebGLTileLayer({
      source: new DataTileSource({
        loader(z, x, y) {
          return new Promise((resolve) => {
            const context = createCanvasContext2D(256, 256);
            context.fillStyle = `rgb(${z}, ${x % 255}, ${y % 255})`;
            context.fillRect(0, 0, 256, 256);
            resolve(context.getImageData(0, 0, 256, 256).data);
          });
        },
      }),
    });

    renderer = layer.createRenderer();
    renderer.prepareFrame({
      viewState: {
        projection: getProjection('EPSG:3857'),
      },
      extent: EPSG3857_EXTENT,
      layerIndex: 0,
      layerStatesArray: [layer.getLayerState()],
      size: [256, 256],
      mapId: 'map-1',
    });

    tileTexture = new TileTexture({
      tile: layer.getSource().getTile(3, 2, 1),
      grid: layer.getSource().getTileGrid(),
      helper: renderer.helper,
    });
  });

  afterEach(() => {
    renderer.dispose();
  });

  it('constructor', function () {
    expect(tileTexture.tile.tileCoord).to.eql([3, 2, 1]);
    expect(tileTexture.coords).to.be.a(WebGLArrayBuffer);
  });

  it('handles data tiles', function (done) {
    const dataTile = tileTexture.tile;
    expect(tileTexture.loaded).to.be(false);
    expect(dataTile.getState()).to.be(TileState.IDLE);
    tileTexture.addEventListener('change', () => {
      if (dataTile.getState() === TileState.LOADED) {
        expect(tileTexture.loaded).to.be(true);
        done();
      }
    });
    dataTile.load();
  });

  it('handles image tiles', function () {
    const imageTile = new ImageTile([0, 0, 0], TileState.LOADED);
    tileTexture.setTile(imageTile);
    expect(tileTexture.loaded).to.be(true);
  });

  it('sets anonymous cors mode for image tiles by default', function () {
    const tile = new ImageTile([0, 0, 0], TileState.IDLE);
    tileTexture.setTile(tile);
    const image = tile.getImage();
    expect(image.crossOrigin).to.be('anonymous');
  });

  it('resepects any existing cors mode', function () {
    const tile = new ImageTile(
      [0, 0, 0],
      TileState.IDLE,
      'https://example.com/tile.png',
      'use-credentials'
    );
    tileTexture.setTile(tile);
    const image = tile.getImage();
    expect(image.crossOrigin).to.be('use-credentials');
  });

  it('registers and unregisters change listener', function () {
    const tile = tileTexture.tile;
    expect(tile.getListeners('change').length).to.be(2);
    tileTexture.dispose();
    expect(tile.getListeners('change').length).to.be(1);
  });

  it('updates metadata and unregisters change listener when setting a different tile', function (done) {
    const tile = tileTexture.tile;
    expect(tile.getListeners('change').length).to.be(2);
    const differentTile = new DataTile({
      tileCoord: [1, 0, 1],
      loader(z, x, y) {
        return Promise.resolve(new Uint8Array(256 * 256 * 3));
      },
    });
    tileTexture.setTile(differentTile);
    expect(tile.getListeners('change').length).to.be(1);
    tileTexture.addEventListener('change', () => {
      expect(tileTexture.bandCount).to.be(3);
      done();
    });
    differentTile.load();
  });
});
