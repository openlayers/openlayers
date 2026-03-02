import TileState from '../../../../../src/ol/TileState.js';
import {get} from '../../../../../src/ol/proj.js';
import GeoTIFFSource from '../../../../../src/ol/source/GeoTIFF.js';

describe('ol/source/GeoTIFF', function () {
  describe('constructor', function () {
    it('sets convertToRGB false by default', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.convertToRGB_).to.be(false);
    });

    it('respects the convertToRGB option', function () {
      const source = new GeoTIFFSource({
        convertToRGB: true,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.convertToRGB_).to.be(true);
    });

    it('accepts auto convertToRGB', function () {
      const source = new GeoTIFFSource({
        convertToRGB: 'auto',
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.convertToRGB_).to.be('auto');
    });

    it('defaults to wrapX: false', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.getWrapX()).to.be(false);
    });

    it('allows wrapX to be set', function () {
      const source = new GeoTIFFSource({
        wrapX: true,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.getWrapX()).to.be(true);
    });

    it('defaults to projection: null', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.getProjection()).to.be(null);
    });

    it('allows projection to be set', function () {
      const projection = 'EPSG:4326';
      const expected = get(projection);
      const source = new GeoTIFFSource({
        projection,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      expect(source.getProjection()).to.be(expected);
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

    it('loads from blob', (done) => {
      fetch('spec/ol/source/images/0-0-0.tif')
        .then((response) => response.blob())
        .then((blob) => {
          const source = new GeoTIFFSource({
            sources: [{blob: blob}],
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

    it('loads from a custom loader', (done) => {
      const fetchUrl = 'spec/ol/source/images/0-0-0.tif';
      let called = false;
      const source = new GeoTIFFSource({
        sources: [
          {
            url: fetchUrl,
            loader: (url, headers, abortSignal) => {
              called = true;
              return fetch(url, {headers, signal: abortSignal});
            },
          },
        ],
      });
      source.on('change', () => {
        if (source.getState() !== 'ready') {
          return;
        }
        expect(called).to.be(true);
        done();
      });
    });

    it('errors when overviews are configured with a custom loader', () => {
      expect(
        () =>
          new GeoTIFFSource({
            sources: [
              {
                url: 'spec/ol/source/images/0-0-0.tif',
                loader: () => Promise.reject(),
                overviews: ['spec/ol/source/images/0-0-0.tif'],
              },
            ],
          }),
      ).to.throwError((error) =>
        expect(error.message).to.be(
          'Source overviews are not supported when using a custom loader',
        ),
      );
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
      expect(source.getState()).to.be('loading');
      source.on('change', () => {
        expect(source.getState()).to.be('ready');
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
        expect(viewOptions.resolutions).to.eql([1.40625, 0.703125, 0.3515625]);
        expect(viewOptions.showFullExtent).to.be(true);
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
