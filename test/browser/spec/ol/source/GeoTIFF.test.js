import GeoTIFFSource from '../../../../../src/ol/source/GeoTIFF.js';
import State from '../../../../../src/ol/source/State.js';
import TileState from '../../../../../src/ol/TileState.js';

describe('ol/source/GeoTIFF', function () {
  describe('constructor', function () {
    it('configures readMethod_ to read rasters', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.readMethod_).to.be('readRasters');
    });

    it('configures readMethod_ to read RGB', function () {
      const source = new GeoTIFFSource({
        convertToRGB: true,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.readMethod_).to.be('readRGB');
    });

    it('generates Float32Array data if normalize is set to false', (done) => {
      const source = new GeoTIFFSource({
        normalize: false,
        sources: [{url: 'spec/ol/source/images/0-0-0.tif'}],
      });
      source.on('change', () => {
        const tile = source.getTile(0, 0, 0);
        source.on('tileloadend', () => {
          expect(tile.getState()).to.be(TileState.LOADED);
          expect(tile.getData()).to.be.a(Float32Array);
          done();
        });
        tile.load();
      });
    });

    it('generates Uint8Array data if normalize is not set to false', (done) => {
      const source = new GeoTIFFSource({
        sources: [{url: 'spec/ol/source/images/0-0-0.tif'}],
      });
      source.on('change', () => {
        const tile = source.getTile(0, 0, 0);
        source.on('tileloadend', () => {
          expect(tile.getState()).to.be(TileState.LOADED);
          expect(tile.getData()).to.be.a(Uint8Array);
          done();
        });
        tile.load();
      });
    });
  });

  describe('loading', function () {
    /** @type {GeoTIFFSource} */
    let source;
    beforeEach(function () {
      source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
    });

    it('manages load states', function (done) {
      expect(source.getState()).to.be(State.LOADING);
      source.on('change', () => {
        expect(source.getState()).to.be(State.READY);
        done();
      });
    });

    it('configures itself from source metadata', function (done) {
      source.on('change', () => {
        expect(source.addAlpha_).to.be(true);
        expect(source.bandCount).to.be(4);
        expect(source.nodataValues_).to.eql([[0]]);
        expect(source.getTileGrid().getResolutions().length).to.be(1);
        expect(source.projection.getCode()).to.be('EPSG:4326');
        expect(source.projection.getUnits()).to.be('degrees');
        done();
      });
    });

    it('resolves view properties', function (done) {
      source.getView().then((viewOptions) => {
        const projection = viewOptions.projection;
        expect(projection.getCode()).to.be('EPSG:4326');
        expect(projection.getUnits()).to.be('degrees');
        expect(viewOptions.extent).to.eql([-180, -90, 180, 90]);
        expect(viewOptions.center).to.eql([0, 0]);
        expect(viewOptions.resolutions).to.eql([0.703125]);
        done();
      });
    });

    it('loads tiles', function (done) {
      source.on('change', () => {
        const tile = source.getTile(0, 0, 0);
        source.on('tileloadend', () => {
          expect(tile.getState()).to.be(TileState.LOADED);
          done();
        });
        tile.load();
      });
    });
  });
});
