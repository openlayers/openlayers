import {getFontParameters} from '../../../src/ol/css.js';

describe('ol.css', function() {

  describe('getFontParameters()', function() {
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
      it('works for ' + c.font, function() {
        const font = getFontParameters(c.font);
        if (c.families === null) {
          expect(font).to.be(null);
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
        expect(font.style).to.eql(c.style);
        expect(font.weight).to.eql(c.weight);
        expect(font.families).to.eql(c.families);
      });
    });

  });

});
