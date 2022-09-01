import Map from '../../../../../src/ol/Map.js';
import MapboxVectorLayer from '../../../../../src/ol/layer/MapboxVector.js';
import View from '../../../../../src/ol/View.js';
import {unByKey} from '../../../../../src/ol/Observable.js';

describe('ol/layer/MapboxVector', () => {
  describe('TileJSON', function () {
    it('lets ol-mapbox-style handle TileJSON URLs', function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl:
          'data:,' +
          encodeURIComponent(
            JSON.stringify({
              version: 8,
              sources: {
                'foo': {
                  url: '/spec/ol/data/tilejson.json',
                  type: 'vector',
                },
              },
              layers: [],
            })
          ),
      });
      layer.on('error', function (e) {
        done(e.error);
      });
      const source = layer.getSource();
      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          expect(source.getTileUrlFunction()([0, 0, 0])).to.be(
            'http://a.tiles.mapbox.com/v3/mapbox.geography-class/0/0/0.png'
          );
          done();
        }
      });
    });
  });

  describe('maxResolution', function () {
    const styleUrl =
      'data:,' +
      encodeURIComponent(
        JSON.stringify({
          version: 8,
          sources: {
            'foo': {
              tiles: ['/spec/ol/data/{z}-{x}-{y}.vector.pbf'],
              type: 'vector',
              minzoom: 6,
            },
          },
          layers: [],
        })
      );

    it('accepts minZoom from configuration', function (done) {
      const layer = new MapboxVectorLayer({
        minZoom: 5,
        styleUrl: styleUrl,
      });
      const source = layer.getSource();
      source.on('change', function onchange() {
        if (source.getState() === 'ready') {
          source.un('change', onchange);
          expect(layer.getMaxResolution()).to.be(Infinity);
          done();
        }
      });
    });

    it('uses minZoom from source', function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl: styleUrl,
      });
      layer.on('error', function (e) {
        done(e.error);
      });
      const source = layer.getSource();
      source.on('change', function onchange() {
        if (source.getState() === 'ready') {
          source.un('change', onchange);
          expect(layer.getMaxResolution()).to.be(
            source.getTileGrid().getResolution(6)
          );
          done();
        }
      });
    });
  });

  describe('background', function () {
    let map;
    beforeEach(function () {
      map = new Map({
        target: createMapDiv(20, 20),
        view: new View({
          zoom: 2,
          center: [0, 0],
        }),
      });
    });
    this.afterEach(function () {
      disposeMap(map);
    });
    it('configures the layer with a background function', function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl:
          'data:,' +
          encodeURIComponent(
            JSON.stringify({
              version: 8,
              sources: {
                'foo': {
                  tiles: ['/spec/ol/data/{z}-{x}-{y}.vector.pbf'],
                  type: 'vector',
                },
              },
              layers: [
                {
                  id: 'background',
                  type: 'background',
                  paint: {
                    'background-color': '#ff0000',
                    'background-opacity': 0.8,
                  },
                },
              ],
            })
          ),
      });
      map.addLayer(layer);
      layer.getSource().once('change', () => {
        layer.once('postrender', (e) => {
          const pixel = Array.from(e.context.getImageData(0, 0, 1, 1).data);
          expect(pixel).to.eql([255, 0, 0, 0.8 * 255]);
          done();
        });
      });
    });

    it("avoids the style's background with `background: false`", function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl:
          'data:,' +
          encodeURIComponent(
            JSON.stringify({
              version: 8,
              sources: {
                'foo': {
                  tiles: ['/spec/ol/data/{z}-{x}-{y}.vector.pbf'],
                  type: 'vector',
                },
              },
              layers: [
                {
                  id: 'background',
                  type: 'background',
                  paint: {
                    'background-color': '#ff0000',
                    'background-opacity': 0.8,
                  },
                },
              ],
            })
          ),
        background: false,
      });
      map.addLayer(layer);
      layer.getSource().once('change', () => {
        layer.once('postrender', (e) => {
          const pixel = Array.from(e.context.getImageData(0, 0, 1, 1).data);
          expect(pixel).to.eql([0, 0, 0, 0]);
          done();
        });
      });
    });

    it('works for styles without background', function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl:
          'data:,' +
          encodeURIComponent(
            JSON.stringify({
              version: 8,
              sources: {
                'foo': {
                  tiles: ['/spec/ol/data/{z}-{x}-{y}.vector.pbf'],
                  type: 'vector',
                },
              },
              layers: [
                {
                  id: 'landuse',
                  type: 'fill',
                  source: 'foo',
                  'source-layer': 'landuse',
                  paint: {
                    'fill-color': '#ff0000',
                    'fill-opacity': 0.8,
                  },
                },
              ],
            })
          ),
      });
      map.addLayer(layer);
      layer.getSource().once('change', () => {
        layer.once('postrender', (e) => {
          const pixel = Array.from(e.context.getImageData(0, 0, 1, 1).data);
          expect(pixel).to.eql([0, 0, 0, 0]);
          done();
        });
      });
    });
  });

  describe('Access token', function () {
    let originalFetch, fetchUrl;
    beforeEach(function () {
      originalFetch = fetch;
      window.fetch = function (url) {
        fetchUrl = url;
        return Promise.resolve({ok: false});
      };
    });
    afterEach(function () {
      window.fetch = originalFetch;
    });
    it('applies correct access token', function () {
      new MapboxVectorLayer({
        styleUrl: 'mapbox://styles/mapbox/streets-v7',
        accessToken: '123',
      });
      expect(fetchUrl.url).to.be(
        'https://api.mapbox.com/styles/v1/mapbox/streets-v7?&access_token=123'
      );
    });
    it('applies correct access token from url', function () {
      new MapboxVectorLayer({
        styleUrl: 'foo?key=123',
      });
      expect(fetchUrl.url).to.be(`${location.origin}/foo?key=123`);
    });
  });
});
