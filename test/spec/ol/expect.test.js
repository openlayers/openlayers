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

  describe('called', function() {

    var telephone;
    beforeEach(function() {
      telephone = sinon.spy();
    });

    it('has caller ID', function() {
      telephone();
      expect(telephone).to.be.called();
    });

    it('also knows when it\'s speaking to the hand', function() {
      (function() {})();
      expect(telephone).not.to.be.called();
    });

  });

  describe('totallyWantsToSpeakToYou', function() {

    var callMeMaybe;
    beforeEach(function() {
      callMeMaybe = sinon.spy();
    });

    it('reminds you that you forgot', function() {
      expect(function() {
        expect(callMeMaybe).to.be.called();
      }).to.throwException();
    });

    it('gets moody all too quickly', function() {
      callMeMaybe();
      expect(function() {
        expect(callMeMaybe).not.to.be.called();
      }).to.throwException();
    });

  });

  describe('called and totallyWantsToSpeakToYou', function() {

    it('are best friends forever \u2665', function() {
      expect(expect(0).to.called).to.be(expect(1).to.totallyWantsToSpeakToYou);
    });

  });

});
