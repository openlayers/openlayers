import FullScreen from '../../../../src/ol/control/FullScreen.js';

describe('ol.control.FullScreen', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new FullScreen();
      expect(instance).to.be.an(FullScreen);
    });

  });

});
