goog.provide('ol.test.string');

describe('ol.string', function() {

  describe('endsWith', function() {
    var subjectString = 'foo bar baz boo';
    var expectedFalse = [
      'foo',
      '\n',
      'humpty',
      'a',
      ' ',
      'foo bar baz boo foo bar baz boo',
      'O',
      'Boo',
      'Foo bar baz boo'
    ];
    var expectedTrue = [
      '',
      'o',
      'boo',
      'baz boo',
      'foo bar baz boo'
    ];
    it('correctly returns true when expected', function() {
      var endsWith = ol.string.endsWith;
      expectedTrue.forEach(function(searchString) {
        expect(endsWith(subjectString, searchString)).to.be(true);
      });
    });
    it('correctly returns false when expected', function() {
      var endsWith = ol.string.endsWith;
      expectedFalse.forEach(function(searchString) {
        expect(endsWith(subjectString, searchString)).to.be(false);
      });
    });
  });

});

goog.require('ol.string');
