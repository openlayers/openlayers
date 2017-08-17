

goog.require('ol.geom.flat.topology');

describe('ol.geom.flat.topology', function() {

  describe('ol.geom.flat.topology.lineStringIsClosed', function() {

    it('identifies closed lines aka boundaries', function() {
      var flatCoordinates = [0, 0, 3, 0, 0, 3, 0, 0];
      var isClosed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).to.be(true);
    });

    it('identifies regular linestrings', function() {
      var flatCoordinates = [0, 0, 3, 0, 0, 3, 5, 2];
      var isClosed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).to.be(false);
    });

    it('identifies degenerate boundaries', function() {
      var flatCoordinates = [0, 0, 3, 0, 0, 0];
      var isClosed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).to.be(false);

      flatCoordinates = [0, 0, 1, 1, 3, 3, 5, 5, 0, 0];
      isClosed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).to.be(false);
    });

  });

});
