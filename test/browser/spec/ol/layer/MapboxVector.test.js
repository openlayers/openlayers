import MapboxVectorLayer, {
  getMapboxPath,
  normalizeSourceUrl,
  normalizeSpriteUrl,
  normalizeStyleUrl,
} from '../../../../../src/ol/layer/MapboxVector.js';
import {asString} from '../../../../../src/ol/color.js';
import {unByKey} from '../../../../../src/ol/Observable.js';

describe('ol/layer/MapboxVector', () => {
  describe('getMapboxPath()', () => {
    const cases = [
      {
        url: 'mapbox://path/to/resource',
        expected: 'path/to/resource',
      },
      {
        url: 'mapbox://path/to/resource?query',
        expected: 'path/to/resource?query',
      },
      {
        url: 'https://example.com/resource',
        expected: '',
      },
    ];

    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(getMapboxPath(c.url)).to.be(c.expected);
      });
    }
  });

  describe('normalizeStyleUrl()', () => {
    const cases = [
      {
        url: 'mapbox://styles/mapbox/bright-v9',
        expected:
          'https://api.mapbox.com/styles/v1/mapbox/bright-v9?&access_token=test-token',
      },
      {
        url: 'https://example.com/style',
        expected: 'https://example.com/style',
      },
    ];

    const token = 'test-token';
    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(normalizeStyleUrl(c.url, token)).to.be(c.expected);
      });
    }
  });

  describe('normalizeSpriteUrl()', () => {
    const cases = [
      {
        url: 'mapbox://sprites/mapbox/bright-v9',
        expected:
          'https://api.mapbox.com/styles/v1/mapbox/bright-v9/sprite?access_token=test-token',
      },
      {
        url: 'https://example.com/sprite',
        expected: 'https://example.com/sprite',
      },
      {
        url: '../sprite',
        expected: 'https://example.com:8000/sprite',
      },
      {
        url: '/sprite',
        expected: 'https://example.com:8000/sprite',
      },
      {
        url: './sprite',
        expected: 'https://example.com:8000/mystyle/sprite',
      },
    ];

    const token = 'test-token';
    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(
          normalizeSpriteUrl(
            c.url,
            token,
            'https://example.com:8000/mystyle/style.json'
          )
        ).to.be(c.expected);
      });
    }
  });

  describe('normalizeSourceUrl()', () => {
    const cases = [
      {
        url: 'mapbox://mapbox.mapbox-streets-v7',
        expected:
          'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.vector.pbf?access_token=test-token',
      },
      {
        url: 'https://example.com/source/{z}/{x}/{y}.pbf',
        expected: 'https://example.com/source/{z}/{x}/{y}.pbf?token=test-token',
      },
      {
        url: 'https://example.com/source/{z}/{x}/{y}.pbf?foo=bar',
        expected:
          'https://example.com/source/{z}/{x}/{y}.pbf?foo=bar&token=test-token',
      },
    ];

    const token = 'test-token';
    const tokenParam = 'token';
    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(normalizeSourceUrl(c.url, token, tokenParam)).to.be(c.expected);
      });
    }
  });

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
      const source = layer.getSource();
      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          expect(layer.getBackground()(1)).to.eql(asString([255, 0, 0, 0.8]));
          done();
        }
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
      const source = layer.getSource();
      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          expect(layer.getBackground()).to.be(false);
          done();
        }
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
      const source = layer.getSource();
      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          expect(layer.getBackground()).to.be(undefined);
          done();
        }
      });
    });
  });

  describe('Access token', function () {
    it('applies correct access token from access_token', function () {
      const layer = new MapboxVectorLayer({
        styleUrl: 'mapbox://styles/mapbox/streets-v7',
        accessToken: '123',
      });
      expect(layer.accessToken).to.be('123');
      expect(layer.accessTokenParam_).to.be(undefined);
    });
    it('applies correct access token from url', function () {
      const layer = new MapboxVectorLayer({
        styleUrl: 'foo?key=123',
      });
      expect(layer.accessToken).to.be('123');
      expect(layer.accessTokenParam_).to.be('key');
    });
  });
});
