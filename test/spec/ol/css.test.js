goog.require('ol.css');

describe('ol.css', function() {

  describe('getFontFamilies()', function() {
    var cases = [{
      font: '2em "Open Sans"',
      families: ['"Open Sans"']
    }, {
      font: '2em \'Open Sans\'',
      families: ['"Open Sans"']
    }, {
      font: '2em "Open Sans", sans-serif',
      families: ['"Open Sans"', 'sans-serif']
    }, {
      font: 'italic small-caps bolder 16px/3 cursive',
      families: ['cursive']
    }, {
      font: 'garbage 2px input',
      families: null
    }, {
      font: '100% fantasy',
      families: ['fantasy']
    }];

    cases.forEach(function(c, i) {
      it('works for ' + c.font, function() {
        var families = ol.css.getFontFamilies(c.font);
        if (c.families === null) {
          expect(families).to.be(null);
          return;
        }
        families.forEach(function(family, j) {
          // Safari uses single quotes for font families, so we have to do extra work
          if (family.charAt(0) === '\'') {
            // we wouldn't want to do this in the lib since it doesn't properly escape quotes
            // but we know that our test cases don't include quotes in font names
            families[j] = '"' + family.slice(1, -1) + '"';
          }
        });
        expect(families).to.eql(c.families);
      });
    });

  });

});
