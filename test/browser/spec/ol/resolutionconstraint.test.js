import {assert} from 'chai';
import {
  createMinMaxResolution,
  createSnapToPower,
  createSnapToResolutions,
} from '../../../../src/ol/resolutionconstraint.js';

describe('ol.resolutionconstraint', function () {
  describe('SnapToResolution', function () {
    let resolutionConstraint;

    beforeEach(function () {
      resolutionConstraint = createSnapToResolutions([1000, 500, 250, 100]);
    });

    describe('direction 0', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1000, 0), 1000);
        assert.deepEqual(resolutionConstraint(500, 0), 500);
        assert.deepEqual(resolutionConstraint(250, 0), 250);
        assert.deepEqual(resolutionConstraint(100, 0), 100);
      });
    });

    describe('direction 1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1000, 1), 1000);
        assert.deepEqual(resolutionConstraint(500, 1), 500);
        assert.deepEqual(resolutionConstraint(250, 1), 250);
        assert.deepEqual(resolutionConstraint(100, 1), 100);
      });
    });

    describe('direction -1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1000, -1), 1000);
        assert.deepEqual(resolutionConstraint(500, -1), 500);
        assert.deepEqual(resolutionConstraint(250, -1), 250);
        assert.deepEqual(resolutionConstraint(100, -1), 100);
      });
    });
  });

  describe('SnapToResolutions Nearest', function () {
    let resolutionConstraint;

    beforeEach(function () {
      resolutionConstraint = createSnapToResolutions([1000, 500, 250, 100]);
    });

    describe('direction 0', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, 0), 1000);
        assert.deepEqual(resolutionConstraint(950, 0), 1000);
        assert.deepEqual(resolutionConstraint(550, 0), 500);
        assert.deepEqual(resolutionConstraint(400, 0), 500);
        assert.deepEqual(resolutionConstraint(300, 0), 250);
        assert.deepEqual(resolutionConstraint(200, 0), 250);
        assert.deepEqual(resolutionConstraint(150, 0), 100);
        assert.deepEqual(resolutionConstraint(50, 0), 100);
      });
    });

    describe('direction 1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, 1), 1000);
        assert.deepEqual(resolutionConstraint(950, 1), 1000);
        assert.deepEqual(resolutionConstraint(550, 1), 1000);
        assert.deepEqual(resolutionConstraint(450, 1), 500);
        assert.deepEqual(resolutionConstraint(300, 1), 500);
        assert.deepEqual(resolutionConstraint(200, 1), 250);
        assert.deepEqual(resolutionConstraint(150, 1), 250);
        assert.deepEqual(resolutionConstraint(50, 1), 100);
      });
    });

    describe('direction -1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, -1), 1000);
        assert.deepEqual(resolutionConstraint(950, -1), 500);
        assert.deepEqual(resolutionConstraint(550, -1), 500);
        assert.deepEqual(resolutionConstraint(450, -1), 250);
        assert.deepEqual(resolutionConstraint(300, -1), 250);
        assert.deepEqual(resolutionConstraint(200, -1), 100);
        assert.deepEqual(resolutionConstraint(150, -1), 100);
        assert.deepEqual(resolutionConstraint(50, -1), 100);
      });
    });
  });

  describe('createSnapToPower', function () {
    let resolutionConstraint;

    beforeEach(function () {
      resolutionConstraint = createSnapToPower(2, 1024, 1);
    });

    describe('delta 0', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1024, 0), 1024);
        assert.deepEqual(resolutionConstraint(512, 0), 512);
        assert.deepEqual(resolutionConstraint(256, 0), 256);
        assert.deepEqual(resolutionConstraint(128, 0), 128);
        assert.deepEqual(resolutionConstraint(64, 0), 64);
        assert.deepEqual(resolutionConstraint(32, 0), 32);
        assert.deepEqual(resolutionConstraint(16, 0), 16);
        assert.deepEqual(resolutionConstraint(8, 0), 8);
        assert.deepEqual(resolutionConstraint(4, 0), 4);
        assert.deepEqual(resolutionConstraint(2, 0), 2);
        assert.deepEqual(resolutionConstraint(1, 0), 1);
      });
    });

    describe('direction 1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1024, 1), 1024);
        assert.deepEqual(resolutionConstraint(512, 1), 512);
        assert.deepEqual(resolutionConstraint(256, 1), 256);
        assert.deepEqual(resolutionConstraint(128, 1), 128);
        assert.deepEqual(resolutionConstraint(64, 1), 64);
        assert.deepEqual(resolutionConstraint(32, 1), 32);
        assert.deepEqual(resolutionConstraint(16, 1), 16);
        assert.deepEqual(resolutionConstraint(8, 1), 8);
        assert.deepEqual(resolutionConstraint(4, 1), 4);
        assert.deepEqual(resolutionConstraint(2, 1), 2);
        assert.deepEqual(resolutionConstraint(1, 1), 1);
      });
    });

    describe('direction -1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1024, -1), 1024);
        assert.deepEqual(resolutionConstraint(512, -1), 512);
        assert.deepEqual(resolutionConstraint(256, -1), 256);
        assert.deepEqual(resolutionConstraint(128, -1), 128);
        assert.deepEqual(resolutionConstraint(64, -1), 64);
        assert.deepEqual(resolutionConstraint(32, -1), 32);
        assert.deepEqual(resolutionConstraint(16, -1), 16);
        assert.deepEqual(resolutionConstraint(8, -1), 8);
        assert.deepEqual(resolutionConstraint(4, -1), 4);
        assert.deepEqual(resolutionConstraint(2, -1), 2);
        assert.deepEqual(resolutionConstraint(1, -1), 1);
      });
    });
  });

  describe('createSnapToPower Nearest', function () {
    let resolutionConstraint;

    beforeEach(function () {
      resolutionConstraint = createSnapToPower(2, 1024, 1);
    });

    describe('direction 0', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, 0), 1024);
        assert.deepEqual(resolutionConstraint(9050, 0), 1024);
        assert.deepEqual(resolutionConstraint(550, 0), 512);
        assert.deepEqual(resolutionConstraint(450, 0), 512);
        assert.deepEqual(resolutionConstraint(300, 0), 256);
        assert.deepEqual(resolutionConstraint(250, 0), 256);
        assert.deepEqual(resolutionConstraint(150, 0), 128);
        assert.deepEqual(resolutionConstraint(100, 0), 128);
        assert.deepEqual(resolutionConstraint(75, 0), 64);
        assert.deepEqual(resolutionConstraint(50, 0), 64);
        assert.deepEqual(resolutionConstraint(40, 0), 32);
        assert.deepEqual(resolutionConstraint(30, 0), 32);
        assert.deepEqual(resolutionConstraint(20, 0), 16);
        assert.deepEqual(resolutionConstraint(12, 0), 16);
        assert.deepEqual(resolutionConstraint(9, 0), 8);
        assert.deepEqual(resolutionConstraint(7, 0), 8);
        assert.deepEqual(resolutionConstraint(5, 0), 4);
        assert.deepEqual(resolutionConstraint(3.5, 0), 4);
        assert.deepEqual(resolutionConstraint(2.1, 0), 2);
        assert.deepEqual(resolutionConstraint(1.9, 0), 2);
        assert.deepEqual(resolutionConstraint(1.1, 0), 1);
        assert.deepEqual(resolutionConstraint(0.9, 0), 1);
      });
    });

    describe('direction 1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, 1), 1024);
        assert.deepEqual(resolutionConstraint(9050, 1), 1024);
        assert.deepEqual(resolutionConstraint(550, 1), 1024);
        assert.deepEqual(resolutionConstraint(450, 1), 512);
        assert.deepEqual(resolutionConstraint(300, 1), 512);
        assert.deepEqual(resolutionConstraint(250, 1), 256);
        assert.deepEqual(resolutionConstraint(150, 1), 256);
        assert.deepEqual(resolutionConstraint(100, 1), 128);
        assert.deepEqual(resolutionConstraint(75, 1), 128);
        assert.deepEqual(resolutionConstraint(50, 1), 64);
        assert.deepEqual(resolutionConstraint(40, 1), 64);
        assert.deepEqual(resolutionConstraint(30, 1), 32);
        assert.deepEqual(resolutionConstraint(20, 1), 32);
        assert.deepEqual(resolutionConstraint(12, 1), 16);
        assert.deepEqual(resolutionConstraint(9, 1), 16);
        assert.deepEqual(resolutionConstraint(7, 1), 8);
        assert.deepEqual(resolutionConstraint(5, 1), 8);
        assert.deepEqual(resolutionConstraint(3.5, 1), 4);
        assert.deepEqual(resolutionConstraint(2.1, 1), 4);
        assert.deepEqual(resolutionConstraint(1.9, 1), 2);
        assert.deepEqual(resolutionConstraint(1.1, 1), 2);
        assert.deepEqual(resolutionConstraint(0.9, 1), 1);
      });
    });

    describe('direction -1', function () {
      it('returns expected resolution value', function () {
        assert.deepEqual(resolutionConstraint(1050, -1), 1024);
        assert.deepEqual(resolutionConstraint(9050, -1), 1024);
        assert.deepEqual(resolutionConstraint(550, -1), 512);
        assert.deepEqual(resolutionConstraint(450, -1), 256);
        assert.deepEqual(resolutionConstraint(300, -1), 256);
        assert.deepEqual(resolutionConstraint(250, -1), 128);
        assert.deepEqual(resolutionConstraint(150, -1), 128);
        assert.deepEqual(resolutionConstraint(100, -1), 64);
        assert.deepEqual(resolutionConstraint(75, -1), 64);
        assert.deepEqual(resolutionConstraint(50, -1), 32);
        assert.deepEqual(resolutionConstraint(40, -1), 32);
        assert.deepEqual(resolutionConstraint(30, -1), 16);
        assert.deepEqual(resolutionConstraint(20, -1), 16);
        assert.deepEqual(resolutionConstraint(12, -1), 8);
        assert.deepEqual(resolutionConstraint(9, -1), 8);
        assert.deepEqual(resolutionConstraint(7, -1), 4);
        assert.deepEqual(resolutionConstraint(5, -1), 4);
        assert.deepEqual(resolutionConstraint(3.5, -1), 2);
        assert.deepEqual(resolutionConstraint(2.1, -1), 2);
        assert.deepEqual(resolutionConstraint(1.9, -1), 1);
        assert.deepEqual(resolutionConstraint(1.1, -1), 1);
        assert.deepEqual(resolutionConstraint(0.9, -1), 1);
      });
    });
  });

  describe('SnapToPower smooth constraint', function () {
    describe('snap to power, smooth constraint on', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createSnapToPower(2, 128, 16, true);

        assert.isAbove(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(150, 0, [100, 100], true), 150);
        assert.isAbove(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(130, 0, [100, 100], true), 130);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(15, 0, [100, 100], true), 15);
        assert.isBelow(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(10, 0, [100, 100], true), 10);
        assert.isBelow(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });

    describe('snap to power, smooth constraint off', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createSnapToPower(2, 128, 16, false);

        assert.deepEqual(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });

    describe('snap to resolutions, smooth constraint on', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createSnapToResolutions(
          [128, 64, 32, 16],
          true,
        );

        assert.isAbove(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(150, 0, [100, 100], true), 150);
        assert.isAbove(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(130, 0, [100, 100], true), 130);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(15, 0, [100, 100], true), 15);
        assert.isBelow(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(10, 0, [100, 100], true), 10);
        assert.isBelow(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });

    describe('snap to resolutions, smooth constraint off', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createSnapToResolutions(
          [128, 64, 32, 16],
          false,
        );

        assert.deepEqual(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });

    describe('min/max, smooth constraint on', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createMinMaxResolution(128, 16, true);

        assert.isAbove(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(150, 0, [100, 100], true), 150);
        assert.isAbove(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.isBelow(resolutionConstraint(130, 0, [100, 100], true), 130);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(15, 0, [100, 100], true), 15);
        assert.isBelow(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.isAbove(resolutionConstraint(10, 0, [100, 100], true), 10);
        assert.isBelow(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });

    describe('min/max, smooth constraint off', function () {
      it('returns expected resolution value', function () {
        const resolutionConstraint = createMinMaxResolution(128, 16, false);

        assert.deepEqual(resolutionConstraint(150, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(130, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(128, 0, [100, 100], true), 128);
        assert.deepEqual(resolutionConstraint(16, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(15, 0, [100, 100], true), 16);
        assert.deepEqual(resolutionConstraint(10, 0, [100, 100], true), 16);
      });
    });
  });
});
