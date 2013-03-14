goog.provide('ol.test.expect.js');


describe('expect.js', function() {

  describe('roughlyEqual', function() {

    it('can tell the difference between 1 and 3', function() {
      expect(1).not.to.roughlyEqual(3, 1);
    });

    it('really can tell the difference between 1 and 3', function() {
      expect(function() {
        expect(1).to.roughlyEqual(3, 0.5);
      }).to.throwException();
    });

  });

  describe('kindaEqual', function() {

    it('thinks that 1 ain\'t so different from 2', function() {
      expect(1).to.kindaEqual(2, 1);
    });

    it('knows that, like, 1 and 2 would, like, totally dig each other',
        function() {
          expect(function() {
            expect(1).to.kindaEqual(2, 1);
          }).not.to.throwException();
        });

  });

  describe('roughlyEqual and kindaEqual', function() {

    it('it\'s like they\'re soul mates', function() {
      expect(expect(0).to.roughlyEqual).to.be(expect(1).to.kindaEqual);
    });

  });

});
