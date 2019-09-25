import {getFontParameters} from '../../../src/ol/css.js';

describe('ol.css', () => {

  describe('getFontParameters()', () => {
    const cases = [{
      font: '2em "Open Sans"',
      style: 'normal',
      weight: 'normal',
      families: ['"Open Sans"']
    }, {
      font: '2em \'Open Sans\'',
      style: 'normal',
      weight: 'normal',
      families: ['"Open Sans"']
    }, {
      font: '2em "Open Sans", sans-serif',
      style: 'normal',
      weight: 'normal',
      families: ['"Open Sans"', 'sans-serif']
    }, {
      font: 'italic small-caps bolder 16px/3 cursive',
      style: 'italic',
      weight: 'bolder',
      families: ['cursive']
    }, {
      font: 'garbage 2px input',
      families: null
    }, {
      font: '100% fantasy',
      style: 'normal',
      weight: 'normal',
      families: ['fantasy']
    }];

    cases.forEach(function(c, i) {
      test('works for ' + c.font, () => {
        const font = getFontParameters(c.font);
        if (c.families === null) {
          expect(font).toBe(null);
          return;
        }
        font.families.forEach(function(family, j) {
          // Safari uses single quotes for font families, so we have to do extra work
          if (family.charAt(0) === '\'') {
            // we wouldn't want to do this in the lib since it doesn't properly escape quotes
            // but we know that our test cases don't include quotes in font names
            font.families[j] = '"' + family.slice(1, -1) + '"';
          }
        });
        expect(font.style).toEqual(c.style);
        expect(font.weight).toEqual(c.weight);
        expect(font.families).toEqual(c.families);
      });
    });

  });

});
