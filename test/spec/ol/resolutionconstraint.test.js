goog.provide('ol.test.ResolutionConstraint');

goog.require('ol.ResolutionConstraint');


describe('ol.ResolutionConstraint', function() {

  describe('SnapToResolution', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 0, 0)).to.eql(1000);
        expect(resolutionConstraint(500, 0, 0)).to.eql(500);
        expect(resolutionConstraint(250, 0, 0)).to.eql(250);
        expect(resolutionConstraint(100, 0, 0)).to.eql(100);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 1, 0)).to.eql(500);
        expect(resolutionConstraint(500, 1, 0)).to.eql(250);
        expect(resolutionConstraint(250, 1, 0)).to.eql(100);
        expect(resolutionConstraint(100, 1, 0)).to.eql(100);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(500, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(250, -1, 0)).to.eql(500);
        expect(resolutionConstraint(100, -1, 0)).to.eql(250);
      });
    });
  });

  describe('SnapToResolutions Nearest', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          ol.ResolutionConstraint.createSnapToResolutions(
              [1000, 500, 250, 100]);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0, 0)).to.eql(1000);
        expect(resolutionConstraint(950, 0, 0)).to.eql(1000);
        expect(resolutionConstraint(550, 0, 0)).to.eql(500);
        expect(resolutionConstraint(400, 0, 0)).to.eql(500);
        expect(resolutionConstraint(300, 0, 0)).to.eql(250);
        expect(resolutionConstraint(200, 0, 0)).to.eql(250);
        expect(resolutionConstraint(150, 0, 0)).to.eql(100);
        expect(resolutionConstraint(50, 0, 0)).to.eql(100);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 1, 0)).to.eql(500);
        expect(resolutionConstraint(950, 1, 0)).to.eql(500);
        expect(resolutionConstraint(550, 1, 0)).to.eql(250);
        expect(resolutionConstraint(450, 1, 0)).to.eql(250);
        expect(resolutionConstraint(300, 1, 0)).to.eql(100);
        expect(resolutionConstraint(200, 1, 0)).to.eql(100);
        expect(resolutionConstraint(150, 1, 0)).to.eql(100);
        expect(resolutionConstraint(50, 1, 0)).to.eql(100);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(950, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(550, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(450, -1, 0)).to.eql(1000);
        expect(resolutionConstraint(300, -1, 0)).to.eql(500);
        expect(resolutionConstraint(200, -1, 0)).to.eql(500);
        expect(resolutionConstraint(150, -1, 0)).to.eql(250);
        expect(resolutionConstraint(50, -1, 0)).to.eql(250);
      });
    });
  });

  describe('createSnapToPower', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          ol.ResolutionConstraint.createSnapToPower(2, 1024, 10);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, 0, 0)).to.eql(1024);
        expect(resolutionConstraint(512, 0, 0)).to.eql(512);
        expect(resolutionConstraint(256, 0, 0)).to.eql(256);
        expect(resolutionConstraint(128, 0, 0)).to.eql(128);
        expect(resolutionConstraint(64, 0, 0)).to.eql(64);
        expect(resolutionConstraint(32, 0, 0)).to.eql(32);
        expect(resolutionConstraint(16, 0, 0)).to.eql(16);
        expect(resolutionConstraint(8, 0, 0)).to.eql(8);
        expect(resolutionConstraint(4, 0, 0)).to.eql(4);
        expect(resolutionConstraint(2, 0, 0)).to.eql(2);
        expect(resolutionConstraint(1, 0, 0)).to.eql(1);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, 1, 0)).to.eql(512);
        expect(resolutionConstraint(512, 1, 0)).to.eql(256);
        expect(resolutionConstraint(256, 1, 0)).to.eql(128);
        expect(resolutionConstraint(128, 1, 0)).to.eql(64);
        expect(resolutionConstraint(64, 1, 0)).to.eql(32);
        expect(resolutionConstraint(32, 1, 0)).to.eql(16);
        expect(resolutionConstraint(16, 1, 0)).to.eql(8);
        expect(resolutionConstraint(8, 1, 0)).to.eql(4);
        expect(resolutionConstraint(4, 1, 0)).to.eql(2);
        expect(resolutionConstraint(2, 1, 0)).to.eql(1);
        expect(resolutionConstraint(1, 1, 0)).to.eql(1);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, -1, 0)).to.eql(1024);
        expect(resolutionConstraint(512, -1, 0)).to.eql(1024);
        expect(resolutionConstraint(256, -1, 0)).to.eql(512);
        expect(resolutionConstraint(128, -1, 0)).to.eql(256);
        expect(resolutionConstraint(64, -1, 0)).to.eql(128);
        expect(resolutionConstraint(32, -1, 0)).to.eql(64);
        expect(resolutionConstraint(16, -1, 0)).to.eql(32);
        expect(resolutionConstraint(8, -1, 0)).to.eql(16);
        expect(resolutionConstraint(4, -1, 0)).to.eql(8);
        expect(resolutionConstraint(2, -1, 0)).to.eql(4);
        expect(resolutionConstraint(1, -1, 0)).to.eql(2);
      });
    });
  });

  describe('createSnapToPower Nearest', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          ol.ResolutionConstraint.createSnapToPower(2, 1024, 10);
    });

    describe('delta 0, direction 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0, 0)).to.eql(1024);
        expect(resolutionConstraint(9050, 0, 0)).to.eql(1024);
        expect(resolutionConstraint(550, 0, 0)).to.eql(512);
        expect(resolutionConstraint(450, 0, 0)).to.eql(512);
        expect(resolutionConstraint(300, 0, 0)).to.eql(256);
        expect(resolutionConstraint(250, 0, 0)).to.eql(256);
        expect(resolutionConstraint(150, 0, 0)).to.eql(128);
        expect(resolutionConstraint(100, 0, 0)).to.eql(128);
        expect(resolutionConstraint(75, 0, 0)).to.eql(64);
        expect(resolutionConstraint(50, 0, 0)).to.eql(64);
        expect(resolutionConstraint(40, 0, 0)).to.eql(32);
        expect(resolutionConstraint(30, 0, 0)).to.eql(32);
        expect(resolutionConstraint(20, 0, 0)).to.eql(16);
        expect(resolutionConstraint(12, 0, 0)).to.eql(16);
        expect(resolutionConstraint(9, 0, 0)).to.eql(8);
        expect(resolutionConstraint(7, 0, 0)).to.eql(8);
        expect(resolutionConstraint(5, 0, 0)).to.eql(4);
        expect(resolutionConstraint(3.5, 0, 0)).to.eql(4);
        expect(resolutionConstraint(2.1, 0, 0)).to.eql(2);
        expect(resolutionConstraint(1.9, 0, 0)).to.eql(2);
        expect(resolutionConstraint(1.1, 0, 0)).to.eql(1);
        expect(resolutionConstraint(0.9, 0, 0)).to.eql(1);
      });
    });

    describe('delta 0, direction > 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0, 1)).to.eql(1024);
        expect(resolutionConstraint(9050, 0, 1)).to.eql(1024);
        expect(resolutionConstraint(550, 0, 1)).to.eql(1024);
        expect(resolutionConstraint(450, 0, 1)).to.eql(512);
        expect(resolutionConstraint(300, 0, 1)).to.eql(512);
        expect(resolutionConstraint(250, 0, 1)).to.eql(256);
        expect(resolutionConstraint(150, 0, 1)).to.eql(256);
        expect(resolutionConstraint(100, 0, 1)).to.eql(128);
        expect(resolutionConstraint(75, 0, 1)).to.eql(128);
        expect(resolutionConstraint(50, 0, 1)).to.eql(64);
        expect(resolutionConstraint(40, 0, 1)).to.eql(64);
        expect(resolutionConstraint(30, 0, 1)).to.eql(32);
        expect(resolutionConstraint(20, 0, 1)).to.eql(32);
        expect(resolutionConstraint(12, 0, 1)).to.eql(16);
        expect(resolutionConstraint(9, 0, 1)).to.eql(16);
        expect(resolutionConstraint(7, 0, 1)).to.eql(8);
        expect(resolutionConstraint(5, 0, 1)).to.eql(8);
        expect(resolutionConstraint(3.5, 0, 1)).to.eql(4);
        expect(resolutionConstraint(2.1, 0, 1)).to.eql(4);
        expect(resolutionConstraint(1.9, 0, 1)).to.eql(2);
        expect(resolutionConstraint(1.1, 0, 1)).to.eql(2);
        expect(resolutionConstraint(0.9, 0, 1)).to.eql(1);
      });
    });

    describe('delta 0, direction < 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0, -1)).to.eql(1024);
        expect(resolutionConstraint(9050, 0, -1)).to.eql(1024);
        expect(resolutionConstraint(550, 0, -1)).to.eql(512);
        expect(resolutionConstraint(450, 0, -1)).to.eql(256);
        expect(resolutionConstraint(300, 0, -1)).to.eql(256);
        expect(resolutionConstraint(250, 0, -1)).to.eql(128);
        expect(resolutionConstraint(150, 0, -1)).to.eql(128);
        expect(resolutionConstraint(100, 0, -1)).to.eql(64);
        expect(resolutionConstraint(75, 0, -1)).to.eql(64);
        expect(resolutionConstraint(50, 0, -1)).to.eql(32);
        expect(resolutionConstraint(40, 0, -1)).to.eql(32);
        expect(resolutionConstraint(30, 0, -1)).to.eql(16);
        expect(resolutionConstraint(20, 0, -1)).to.eql(16);
        expect(resolutionConstraint(12, 0, -1)).to.eql(8);
        expect(resolutionConstraint(9, 0, -1)).to.eql(8);
        expect(resolutionConstraint(7, 0, -1)).to.eql(4);
        expect(resolutionConstraint(5, 0, -1)).to.eql(4);
        expect(resolutionConstraint(3.5, 0, -1)).to.eql(2);
        expect(resolutionConstraint(2.1, 0, -1)).to.eql(2);
        expect(resolutionConstraint(1.9, 0, -1)).to.eql(1);
        expect(resolutionConstraint(1.1, 0, -1)).to.eql(1);
        expect(resolutionConstraint(0.9, 0, -1)).to.eql(1);
      });
    });
  });
});
