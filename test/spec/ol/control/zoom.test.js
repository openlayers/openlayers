import Zoom from '../../../../src/ol/control/Zoom.js';

describe('ol.control.Zoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new Zoom();
      expect(instance).to.be.an(Zoom);
    });

  });

});
