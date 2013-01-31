goog.provide('ol.test.ResolutionConstraint');

describe('ol.ResolutionConstraint', function() {

  describe('SnapToResolution', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
            ol.ResolutionConstraint.createSnapToResolutions(
                [1000, 500, 250, 100]);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 0)).toEqual(1000);
        expect(resolutionConstraint(500, 0)).toEqual(500);
        expect(resolutionConstraint(250, 0)).toEqual(250);
        expect(resolutionConstraint(100, 0)).toEqual(100);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 1)).toEqual(500);
        expect(resolutionConstraint(500, 1)).toEqual(250);
        expect(resolutionConstraint(250, 1)).toEqual(100);
        expect(resolutionConstraint(100, 1)).toEqual(100);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, -1)).toEqual(1000);
        expect(resolutionConstraint(500, -1)).toEqual(1000);
        expect(resolutionConstraint(250, -1)).toEqual(500);
        expect(resolutionConstraint(100, -1)).toEqual(250);
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
        expect(resolutionConstraint(1050, 0)).toEqual(1000);
        expect(resolutionConstraint(950, 0)).toEqual(1000);
        expect(resolutionConstraint(550, 0)).toEqual(500);
        expect(resolutionConstraint(400, 0)).toEqual(500);
        expect(resolutionConstraint(300, 0)).toEqual(250);
        expect(resolutionConstraint(200, 0)).toEqual(250);
        expect(resolutionConstraint(150, 0)).toEqual(100);
        expect(resolutionConstraint(50, 0)).toEqual(100);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 1)).toEqual(500);
        expect(resolutionConstraint(950, 1)).toEqual(500);
        expect(resolutionConstraint(550, 1)).toEqual(250);
        expect(resolutionConstraint(450, 1)).toEqual(250);
        expect(resolutionConstraint(300, 1)).toEqual(100);
        expect(resolutionConstraint(200, 1)).toEqual(100);
        expect(resolutionConstraint(150, 1)).toEqual(100);
        expect(resolutionConstraint(50, 1)).toEqual(100);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, -1)).toEqual(1000);
        expect(resolutionConstraint(950, -1)).toEqual(1000);
        expect(resolutionConstraint(550, -1)).toEqual(1000);
        expect(resolutionConstraint(450, -1)).toEqual(1000);
        expect(resolutionConstraint(300, -1)).toEqual(500);
        expect(resolutionConstraint(200, -1)).toEqual(500);
        expect(resolutionConstraint(150, -1)).toEqual(250);
        expect(resolutionConstraint(50, -1)).toEqual(250);
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
        expect(resolutionConstraint(1024, 0)).toEqual(1024);
        expect(resolutionConstraint(512, 0)).toEqual(512);
        expect(resolutionConstraint(256, 0)).toEqual(256);
        expect(resolutionConstraint(128, 0)).toEqual(128);
        expect(resolutionConstraint(64, 0)).toEqual(64);
        expect(resolutionConstraint(32, 0)).toEqual(32);
        expect(resolutionConstraint(16, 0)).toEqual(16);
        expect(resolutionConstraint(8, 0)).toEqual(8);
        expect(resolutionConstraint(4, 0)).toEqual(4);
        expect(resolutionConstraint(2, 0)).toEqual(2);
        expect(resolutionConstraint(1, 0)).toEqual(1);
      });
    });

    describe('zoom in', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, 1)).toEqual(512);
        expect(resolutionConstraint(512, 1)).toEqual(256);
        expect(resolutionConstraint(256, 1)).toEqual(128);
        expect(resolutionConstraint(128, 1)).toEqual(64);
        expect(resolutionConstraint(64, 1)).toEqual(32);
        expect(resolutionConstraint(32, 1)).toEqual(16);
        expect(resolutionConstraint(16, 1)).toEqual(8);
        expect(resolutionConstraint(8, 1)).toEqual(4);
        expect(resolutionConstraint(4, 1)).toEqual(2);
        expect(resolutionConstraint(2, 1)).toEqual(1);
        expect(resolutionConstraint(1, 1)).toEqual(1);
      });
    });

    describe('zoom out', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, -1)).toEqual(1024);
        expect(resolutionConstraint(512, -1)).toEqual(1024);
        expect(resolutionConstraint(256, -1)).toEqual(512);
        expect(resolutionConstraint(128, -1)).toEqual(256);
        expect(resolutionConstraint(64, -1)).toEqual(128);
        expect(resolutionConstraint(32, -1)).toEqual(64);
        expect(resolutionConstraint(16, -1)).toEqual(32);
        expect(resolutionConstraint(8, -1)).toEqual(16);
        expect(resolutionConstraint(4, -1)).toEqual(8);
        expect(resolutionConstraint(2, -1)).toEqual(4);
        expect(resolutionConstraint(1, -1)).toEqual(2);
      });
    });
  });

  describe('createSnapToPower Nearest', function() {

    var resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          ol.ResolutionConstraint.createSnapToPower(2, 1024, 10);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0)).toEqual(1024);
        expect(resolutionConstraint(9050, 0)).toEqual(1024);
        expect(resolutionConstraint(550, 0)).toEqual(512);
        expect(resolutionConstraint(450, 0)).toEqual(512);
        expect(resolutionConstraint(300, 0)).toEqual(256);
        expect(resolutionConstraint(250, 0)).toEqual(256);
        expect(resolutionConstraint(150, 0)).toEqual(128);
        expect(resolutionConstraint(100, 0)).toEqual(128);
        expect(resolutionConstraint(75, 0)).toEqual(64);
        expect(resolutionConstraint(50, 0)).toEqual(64);
        expect(resolutionConstraint(40, 0)).toEqual(32);
        expect(resolutionConstraint(30, 0)).toEqual(32);
        expect(resolutionConstraint(20, 0)).toEqual(16);
        expect(resolutionConstraint(12, 0)).toEqual(16);
        expect(resolutionConstraint(9, 0)).toEqual(8);
        expect(resolutionConstraint(7, 0)).toEqual(8);
        expect(resolutionConstraint(5, 0)).toEqual(4);
        expect(resolutionConstraint(3.5, 0)).toEqual(4);
        expect(resolutionConstraint(2.1, 0)).toEqual(2);
        expect(resolutionConstraint(1.9, 0)).toEqual(2);
        expect(resolutionConstraint(1.1, 0)).toEqual(1);
        expect(resolutionConstraint(0.9, 0)).toEqual(1);
      });
    });
  });
});

goog.require('ol.ResolutionConstraint');
