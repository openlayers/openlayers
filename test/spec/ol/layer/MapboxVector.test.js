import {
  getMapboxPath,
  normalizeSourceUrl,
  normalizeSpriteUrl,
  normalizeStyleUrl,
} from '../../../../src/ol/layer/MapboxVector.js';

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
        expected: 'https://example.com/source/{z}/{x}/{y}.pbf',
      },
    ];

    const token = 'test-token';
    for (const c of cases) {
      it(`works for ${c.url}`, () => {
        expect(normalizeSourceUrl(c.url, token)).to.be(c.expected);
      });
    }
  });
});
