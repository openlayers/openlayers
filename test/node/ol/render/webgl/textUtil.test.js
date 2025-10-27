import {
  createFilterForFeaturesWithText,
  transformToTextStyle,
} from '../../../../../src/ol/render/webgl/textUtil.js';
import expect from '../../../expect.js';

describe('ol/render/webgl/textUtil', function () {
  describe('createFilterForFeaturesWithText()', function () {
    it('compiles all filters into a single expression', function () {
      const style = [
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'cemetery'],
          ],
          else: true,
          style: {
            'fill-color': '#e0e4dd',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'country_label'],
            ['==', ['get', 'scalerank'], 2],
            ['<=', ['resolution'], 19567],
          ],
          else: true,
          style: {
            'fill-color': '#e0e4dd',
            'text-value': ['get', 'name_en'],
            'text-font':
              'bold 10px "Open Sans", "Arial Unicode MS", sans-serif',
            'text-fill-color': '#334',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['==', ['get', 'type'], 'village'],
            ['<=', ['resolution'], 38],
          ],
          else: true,
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#333',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['<=', ['resolution'], 19],
            ['==', ['get', 'type'], 'neighbourhood'],
          ],
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#633',
          },
        },
      ];

      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql([
        'any',
        [
          'all',
          [
            '!',
            [
              'all',
              ['==', ['get', 'layer'], 'landuse'],
              ['==', ['get', 'class'], 'park'],
            ],
          ],
          [
            '!',
            [
              'all',
              ['==', ['get', 'layer'], 'landuse'],
              ['==', ['get', 'class'], 'cemetery'],
            ],
          ],
          ['==', ['get', 'layer'], 'country_label'],
          ['==', ['get', 'scalerank'], 2],
          ['<=', ['resolution'], 19567],
        ],
        [
          'all',
          [
            '!',
            [
              'all',
              ['==', ['get', 'layer'], 'landuse'],
              ['==', ['get', 'class'], 'park'],
            ],
          ],
          [
            '!',
            [
              'all',
              ['==', ['get', 'layer'], 'landuse'],
              ['==', ['get', 'class'], 'cemetery'],
            ],
          ],
          ['==', ['get', 'layer'], 'place_label'],
          ['==', ['get', 'type'], 'village'],
          ['<=', ['resolution'], 38],
        ],
        [
          'all',
          ['==', ['get', 'layer'], 'place_label'],
          ['<=', ['resolution'], 19],
          ['==', ['get', 'type'], 'neighbourhood'],
        ],
      ]);
    });
    it('returns a single matching filter', function () {
      const style = [
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['<=', ['resolution'], 38],
          ],
          style: {
            'text-value': ['get', 'name_en'],
            'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
          },
        },
      ];

      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql([
        'all',
        ['==', ['get', 'layer'], 'place_label'],
        ['<=', ['resolution'], 38],
      ]);
    });
    it('returns a deny-all filter expression if no text style', function () {
      const style = [
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
      ];

      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(false);
    });
    it('returns a match-all filter expression if no filter on the text style', function () {
      const style = [
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'landuse'],
            ['==', ['get', 'class'], 'park'],
          ],
          style: {
            'fill-color': '#d8e8c8',
          },
        },
        {
          style: {
            'text-value': ['get', 'name_en'],
            'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
          },
        },
      ];

      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(true);
    });
    it('returns catch-all if a single style contains text properties', function () {
      const style = {
        'fill-color': '#d8e8c8',
        'text-value': ['get', 'name_en'],
        'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
      };
      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(true);
    });
    it('returns deny-all if a single style does not contain text properties', function () {
      const style = {
        'fill-color': '#d8e8c8',
      };
      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(false);
    });
    it('returns catch-all if an array of styles contains text properties', function () {
      const style = [
        {
          'fill-color': '#d8e8c8',
          'text-value': ['get', 'name_en'],
          'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
        },
        {
          'fill-color': '#d8e8c8',
        },
      ];
      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(true);
    });
    it('returns deny-all if an array of styles does not contain text properties', function () {
      const style = [
        {
          'fill-color': '#d8e8c8',
        },
        {
          'stroke-color': '#d8e8c8',
          'stroke-width': 2,
        },
      ];
      const filter = createFilterForFeaturesWithText(style);
      expect(filter).to.eql(false);
    });
  });
  describe('transformToTextStyle()', function () {
    it('compiles all filters into a single expression', function () {
      const style = [
        {
          filter: [
            'all',
            [
              '!',
              [
                'all',
                ['==', ['get', 'layer'], 'landuse'],
                ['==', ['get', 'class'], 'park'],
              ],
            ],
            [
              '!',
              [
                'all',
                ['==', ['get', 'layer'], 'landuse'],
                ['==', ['get', 'class'], 'cemetery'],
              ],
            ],
            ['==', ['get', 'layer'], 'country_label'],
            ['==', ['get', 'scalerank'], 2],
            ['<=', ['resolution'], 19567],
          ],
          style: {
            'fill-color': '#e0e4dd',
            'text-value': ['get', 'name_en'],
            'text-font':
              'bold 10px "Open Sans", "Arial Unicode MS", sans-serif',
            'text-fill-color': '#334',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['==', ['get', 'type'], 'village'],
            ['<=', ['resolution'], 38],
          ],
          else: true,
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#333',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['<=', ['resolution'], 19],
            ['==', ['get', 'type'], 'neighbourhood'],
          ],
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#633',
          },
        },
      ];

      const textStyle = transformToTextStyle(style);
      expect(textStyle).to.eql([
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'country_label'],
            ['==', ['get', 'scalerank'], 2],
            ['<=', ['resolution'], 19567],
          ],
          else: true,
          style: {
            'text-value': ['get', 'name_en'],
            'text-font':
              'bold 10px "Open Sans", "Arial Unicode MS", sans-serif',
            'text-fill-color': '#334',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['==', ['get', 'type'], 'village'],
            ['<=', ['resolution'], 38],
          ],
          else: true,
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#333',
          },
        },
        {
          filter: [
            'all',
            ['==', ['get', 'layer'], 'place_label'],
            ['<=', ['resolution'], 19],
            ['==', ['get', 'type'], 'neighbourhood'],
          ],
          style: {
            'text-value': ['get', 'name_en'],
            'text-fill-color': '#633',
          },
        },
      ]);
    });
    it('discards style properties in a single style that are not text-related', function () {
      const style = {
        'fill-color': '#d8e8c8',
        'text-value': ['get', 'name_en'],
        'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
      };
      const textStyle = transformToTextStyle(style);
      expect(textStyle).to.eql({
        'text-value': ['get', 'name_en'],
        'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
      });
    });
    it('returns null if no properties in a single style is text-related', function () {
      const style = {
        'stroke-color': '#d8e8c8',
        'stroke-width': 2,
        'fill-color': '#d8e8c8',
      };
      const textStyle = transformToTextStyle(style);
      expect(textStyle).to.eql(null);
    });
    it('discards styles in an array of styles that are not text-related', function () {
      const style = [
        {
          'fill-color': '#d8e8c8',
          'text-value': ['get', 'name_en'],
          'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
        },
        {
          'fill-color': '#d8e8c8',
        },
      ];
      const textStyle = transformToTextStyle(style);
      expect(textStyle).to.eql([
        {
          'text-value': ['get', 'name_en'],
          'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
        },
      ]);
    });
    it('returns null if no style in a style array is text-related', function () {
      const style = [
        {
          'stroke-color': '#d8e8c8',
          'stroke-width': 2,
        },
        {
          'fill-color': '#d8e8c8',
        },
      ];
      const textStyle = transformToTextStyle(style);
      expect(textStyle).to.eql(null);
    });
  });
});
