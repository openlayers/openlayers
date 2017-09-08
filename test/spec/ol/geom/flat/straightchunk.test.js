goog.require('ol.geom.flat.straightchunk');


describe('ol.geom.flat.straightchunk', function() {

  describe('ol.geom.flat.straightchunk.lineString', function() {

    describe('single segment with stride == 3', function() {
      var flatCoords = [0, 0, 42, 1, 1, 42];
      var stride = 3;

      it('returns whole line with angle delta', function() {
        var got = ol.geom.flat.straightchunk.lineString(Math.PI / 4, flatCoords, 0, 6, stride);
        expect(got).to.eql([0, 6]);
      });

      it('returns whole line with zero angle delta', function() {
        var got = ol.geom.flat.straightchunk.lineString(0, flatCoords, 0, 6, stride);
        expect(got).to.eql([0, 6]);
      });

    });

    describe('short line string', function() {
      var flatCoords = [0, 0, 1, 0, 1, 1, 0, 1];
      var stride = 2;

      it('returns whole line if straight enough', function() {
        var got = ol.geom.flat.straightchunk.lineString(Math.PI, flatCoords, 0, 8, stride);
        expect(got).to.eql([0, 8]);
      });

      it('returns first matching chunk if all chunk lengths are the same', function() {
        var got = ol.geom.flat.straightchunk.lineString(Math.PI / 4, flatCoords, 0, 8, stride);
        expect(got).to.eql([0, 4]);
      });

    });

    describe('longer line string', function() {
      var flatCoords = [0, 0, 1, 0, 1, 1, 0, 1, 0, -1, -1, -1, -1, 0, -1, 2, -2, 4];
      var stride = 2;

      it('returns stright chunk from within the linestring', function() {
        var got = ol.geom.flat.straightchunk.lineString(0, flatCoords, 0, 18, stride);
        expect(got).to.eql([10, 16]);
      });

      it('returns long chunk at the end if angle and length within threshold', function() {
        var got = ol.geom.flat.straightchunk.lineString(Math.PI / 4, flatCoords, 0, 18, stride);
        expect(got).to.eql([10, 18]);
      });

    });

  });

});
