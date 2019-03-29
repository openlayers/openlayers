import {createSnapToResolutions, createSnapToPower} from '../../../src/ol/resolutionconstraint.js';
import {createMinMaxResolution} from '../../../src/ol/resolutionconstraint';


describe('ol.resolutionconstraint', function() {

  describe('SnapToResolution', function() {

    let resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint = createSnapToResolutions(
        [1000, 500, 250, 100]);
    });

    describe('direction 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 0)).to.eql(1000);
        expect(resolutionConstraint(500, 0)).to.eql(500);
        expect(resolutionConstraint(250, 0)).to.eql(250);
        expect(resolutionConstraint(100, 0)).to.eql(100);
      });
    });

    describe('direction 1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, 1)).to.eql(1000);
        expect(resolutionConstraint(500, 1)).to.eql(500);
        expect(resolutionConstraint(250, 1)).to.eql(250);
        expect(resolutionConstraint(100, 1)).to.eql(100);
      });
    });

    describe('direction -1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1000, -1)).to.eql(1000);
        expect(resolutionConstraint(500, -1)).to.eql(500);
        expect(resolutionConstraint(250, -1)).to.eql(250);
        expect(resolutionConstraint(100, -1)).to.eql(100);
      });
    });
  });

  describe('SnapToResolutions Nearest', function() {

    let resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          createSnapToResolutions(
            [1000, 500, 250, 100]);
    });

    describe('direction 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0)).to.eql(1000);
        expect(resolutionConstraint(950, 0)).to.eql(1000);
        expect(resolutionConstraint(550, 0)).to.eql(500);
        expect(resolutionConstraint(400, 0)).to.eql(500);
        expect(resolutionConstraint(300, 0)).to.eql(250);
        expect(resolutionConstraint(200, 0)).to.eql(250);
        expect(resolutionConstraint(150, 0)).to.eql(100);
        expect(resolutionConstraint(50, 0)).to.eql(100);
      });
    });

    describe('direction 1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 1)).to.eql(1000);
        expect(resolutionConstraint(950, 1)).to.eql(1000);
        expect(resolutionConstraint(550, 1)).to.eql(1000);
        expect(resolutionConstraint(450, 1)).to.eql(500);
        expect(resolutionConstraint(300, 1)).to.eql(500);
        expect(resolutionConstraint(200, 1)).to.eql(250);
        expect(resolutionConstraint(150, 1)).to.eql(250);
        expect(resolutionConstraint(50, 1)).to.eql(100);
      });
    });

    describe('direction -1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, -1)).to.eql(1000);
        expect(resolutionConstraint(950, -1)).to.eql(500);
        expect(resolutionConstraint(550, -1)).to.eql(500);
        expect(resolutionConstraint(450, -1)).to.eql(250);
        expect(resolutionConstraint(300, -1)).to.eql(250);
        expect(resolutionConstraint(200, -1)).to.eql(100);
        expect(resolutionConstraint(150, -1)).to.eql(100);
        expect(resolutionConstraint(50, -1)).to.eql(100);
      });
    });
  });

  describe('createSnapToPower', function() {

    let resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          createSnapToPower(2, 1024, 1);
    });

    describe('delta 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, 0)).to.eql(1024);
        expect(resolutionConstraint(512, 0)).to.eql(512);
        expect(resolutionConstraint(256, 0)).to.eql(256);
        expect(resolutionConstraint(128, 0)).to.eql(128);
        expect(resolutionConstraint(64, 0)).to.eql(64);
        expect(resolutionConstraint(32, 0)).to.eql(32);
        expect(resolutionConstraint(16, 0)).to.eql(16);
        expect(resolutionConstraint(8, 0)).to.eql(8);
        expect(resolutionConstraint(4, 0)).to.eql(4);
        expect(resolutionConstraint(2, 0)).to.eql(2);
        expect(resolutionConstraint(1, 0)).to.eql(1);
      });
    });

    describe('direction 1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, 1)).to.eql(1024);
        expect(resolutionConstraint(512, 1)).to.eql(512);
        expect(resolutionConstraint(256, 1)).to.eql(256);
        expect(resolutionConstraint(128, 1)).to.eql(128);
        expect(resolutionConstraint(64, 1)).to.eql(64);
        expect(resolutionConstraint(32, 1)).to.eql(32);
        expect(resolutionConstraint(16, 1)).to.eql(16);
        expect(resolutionConstraint(8, 1)).to.eql(8);
        expect(resolutionConstraint(4, 1)).to.eql(4);
        expect(resolutionConstraint(2, 1)).to.eql(2);
        expect(resolutionConstraint(1, 1)).to.eql(1);
      });
    });

    describe('direction -1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1024, -1)).to.eql(1024);
        expect(resolutionConstraint(512, -1)).to.eql(512);
        expect(resolutionConstraint(256, -1)).to.eql(256);
        expect(resolutionConstraint(128, -1)).to.eql(128);
        expect(resolutionConstraint(64, -1)).to.eql(64);
        expect(resolutionConstraint(32, -1)).to.eql(32);
        expect(resolutionConstraint(16, -1)).to.eql(16);
        expect(resolutionConstraint(8, -1)).to.eql(8);
        expect(resolutionConstraint(4, -1)).to.eql(4);
        expect(resolutionConstraint(2, -1)).to.eql(2);
        expect(resolutionConstraint(1, -1)).to.eql(1);
      });
    });
  });

  describe('createSnapToPower Nearest', function() {

    let resolutionConstraint;

    beforeEach(function() {
      resolutionConstraint =
          createSnapToPower(2, 1024, 1);
    });

    describe('direction 0', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 0)).to.eql(1024);
        expect(resolutionConstraint(9050, 0)).to.eql(1024);
        expect(resolutionConstraint(550, 0)).to.eql(512);
        expect(resolutionConstraint(450, 0)).to.eql(512);
        expect(resolutionConstraint(300, 0)).to.eql(256);
        expect(resolutionConstraint(250, 0)).to.eql(256);
        expect(resolutionConstraint(150, 0)).to.eql(128);
        expect(resolutionConstraint(100, 0)).to.eql(128);
        expect(resolutionConstraint(75, 0)).to.eql(64);
        expect(resolutionConstraint(50, 0)).to.eql(64);
        expect(resolutionConstraint(40, 0)).to.eql(32);
        expect(resolutionConstraint(30, 0)).to.eql(32);
        expect(resolutionConstraint(20, 0)).to.eql(16);
        expect(resolutionConstraint(12, 0)).to.eql(16);
        expect(resolutionConstraint(9, 0)).to.eql(8);
        expect(resolutionConstraint(7, 0)).to.eql(8);
        expect(resolutionConstraint(5, 0)).to.eql(4);
        expect(resolutionConstraint(3.5, 0)).to.eql(4);
        expect(resolutionConstraint(2.1, 0)).to.eql(2);
        expect(resolutionConstraint(1.9, 0)).to.eql(2);
        expect(resolutionConstraint(1.1, 0)).to.eql(1);
        expect(resolutionConstraint(0.9, 0)).to.eql(1);
      });
    });

    describe('direction 1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, 1)).to.eql(1024);
        expect(resolutionConstraint(9050, 1)).to.eql(1024);
        expect(resolutionConstraint(550, 1)).to.eql(1024);
        expect(resolutionConstraint(450, 1)).to.eql(512);
        expect(resolutionConstraint(300, 1)).to.eql(512);
        expect(resolutionConstraint(250, 1)).to.eql(256);
        expect(resolutionConstraint(150, 1)).to.eql(256);
        expect(resolutionConstraint(100, 1)).to.eql(128);
        expect(resolutionConstraint(75, 1)).to.eql(128);
        expect(resolutionConstraint(50, 1)).to.eql(64);
        expect(resolutionConstraint(40, 1)).to.eql(64);
        expect(resolutionConstraint(30, 1)).to.eql(32);
        expect(resolutionConstraint(20, 1)).to.eql(32);
        expect(resolutionConstraint(12, 1)).to.eql(16);
        expect(resolutionConstraint(9, 1)).to.eql(16);
        expect(resolutionConstraint(7, 1)).to.eql(8);
        expect(resolutionConstraint(5, 1)).to.eql(8);
        expect(resolutionConstraint(3.5, 1)).to.eql(4);
        expect(resolutionConstraint(2.1, 1)).to.eql(4);
        expect(resolutionConstraint(1.9, 1)).to.eql(2);
        expect(resolutionConstraint(1.1, 1)).to.eql(2);
        expect(resolutionConstraint(0.9, 1)).to.eql(1);
      });
    });

    describe('direction -1', function() {
      it('returns expected resolution value', function() {
        expect(resolutionConstraint(1050, -1)).to.eql(1024);
        expect(resolutionConstraint(9050, -1)).to.eql(1024);
        expect(resolutionConstraint(550, -1)).to.eql(512);
        expect(resolutionConstraint(450, -1)).to.eql(256);
        expect(resolutionConstraint(300, -1)).to.eql(256);
        expect(resolutionConstraint(250, -1)).to.eql(128);
        expect(resolutionConstraint(150, -1)).to.eql(128);
        expect(resolutionConstraint(100, -1)).to.eql(64);
        expect(resolutionConstraint(75, -1)).to.eql(64);
        expect(resolutionConstraint(50, -1)).to.eql(32);
        expect(resolutionConstraint(40, -1)).to.eql(32);
        expect(resolutionConstraint(30, -1)).to.eql(16);
        expect(resolutionConstraint(20, -1)).to.eql(16);
        expect(resolutionConstraint(12, -1)).to.eql(8);
        expect(resolutionConstraint(9, -1)).to.eql(8);
        expect(resolutionConstraint(7, -1)).to.eql(4);
        expect(resolutionConstraint(5, -1)).to.eql(4);
        expect(resolutionConstraint(3.5, -1)).to.eql(2);
        expect(resolutionConstraint(2.1, -1)).to.eql(2);
        expect(resolutionConstraint(1.9, -1)).to.eql(1);
        expect(resolutionConstraint(1.1, -1)).to.eql(1);
        expect(resolutionConstraint(0.9, -1)).to.eql(1);
      });
    });
  });

  describe('SnapToPower smooth constraint', function() {

    describe('snap to power, smooth constraint on', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createSnapToPower(2, 128, 16, true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.lessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.lessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.greaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.lessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.greaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.lessThan(16);
      });
    });

    describe('snap to power, smooth constraint off', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createSnapToPower(2, 128, 16, false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.eql(16);
      });
    });

    describe('snap to resolutions, smooth constraint on', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createSnapToResolutions([128, 64, 32, 16], true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.lessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.lessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.greaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.lessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.greaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.lessThan(16);
      });
    });

    describe('snap to resolutions, smooth constraint off', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createSnapToResolutions([128, 64, 32, 16], false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.eql(16);
      });
    });

    describe('min/max, smooth constraint on', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createMinMaxResolution(128, 16, true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).to.be.lessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.greaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.be.lessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.greaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.be.lessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.greaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.be.lessThan(16);
      });
    });

    describe('min/max, smooth constraint off', function() {
      it('returns expected resolution value', function() {
        const resolutionConstraint = createMinMaxResolution(128, 16, false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).to.eql(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).to.eql(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).to.eql(16);
      });
    });
  });

});
