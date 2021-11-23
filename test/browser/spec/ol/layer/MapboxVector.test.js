import MapboxVectorLayer, {
  getMapboxPath,
  normalizeSourceUrl,
  normalizeSpriteUrl,
  normalizeStyleUrl,
} from '../../../../../src/ol/layer/MapboxVector.js';
import {get} from '../../../../../src/ol/proj.js';
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
    ];

    const token = 'test-token';
    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(normalizeSpriteUrl(c.url, token)).to.be(c.expected);
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

  describe('background', function () {
    it('adds a feature for the background', function (done) {
      const layer = new MapboxVectorLayer({
        styleUrl:
          'data:,' +
          encodeURIComponent(
            JSON.stringify({
              version: 8,
              sources: {
                'foo': {
                  url: '/spec/ol/data/{z}-{x}-{y}.vector.pbf',
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
          source.getTile(14, 8938, 5680, 1, get('EPSG:3857')).load();
          source.once('tileloadend', (event) => {
            const features = event.tile.getFeatures();
            if (!features) {
              event.tile.setFeatures([]);
            }
            expect(features[0].get('layer')).to.be('background');
            expect(
              features[0].getStyleFunction()().getFill().getColor()
            ).to.eql([255, 0, 0, 0.8]);
            done();
          });
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
