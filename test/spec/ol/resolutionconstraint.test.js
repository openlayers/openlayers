import {createSnapToResolutions, createSnapToPower} from '../../../src/ol/resolutionconstraint.js';
import {createMinMaxResolution} from '../../../src/ol/resolutionconstraint.js';


describe('ol.resolutionconstraint', () => {

  describe('SnapToResolution', () => {

    let resolutionConstraint;

    beforeEach(() => {
      resolutionConstraint = createSnapToResolutions(
        [1000, 500, 250, 100]);
    });

    describe('direction 0', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1000, 0)).toEqual(1000);
        expect(resolutionConstraint(500, 0)).toEqual(500);
        expect(resolutionConstraint(250, 0)).toEqual(250);
        expect(resolutionConstraint(100, 0)).toEqual(100);
      });
    });

    describe('direction 1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1000, 1)).toEqual(1000);
        expect(resolutionConstraint(500, 1)).toEqual(500);
        expect(resolutionConstraint(250, 1)).toEqual(250);
        expect(resolutionConstraint(100, 1)).toEqual(100);
      });
    });

    describe('direction -1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1000, -1)).toEqual(1000);
        expect(resolutionConstraint(500, -1)).toEqual(500);
        expect(resolutionConstraint(250, -1)).toEqual(250);
        expect(resolutionConstraint(100, -1)).toEqual(100);
      });
    });
  });

  describe('SnapToResolutions Nearest', () => {

    let resolutionConstraint;

    beforeEach(() => {
      resolutionConstraint =
          createSnapToResolutions(
            [1000, 500, 250, 100]);
    });

    describe('direction 0', () => {
      test('returns expected resolution value', () => {
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

    describe('direction 1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1050, 1)).toEqual(1000);
        expect(resolutionConstraint(950, 1)).toEqual(1000);
        expect(resolutionConstraint(550, 1)).toEqual(1000);
        expect(resolutionConstraint(450, 1)).toEqual(500);
        expect(resolutionConstraint(300, 1)).toEqual(500);
        expect(resolutionConstraint(200, 1)).toEqual(250);
        expect(resolutionConstraint(150, 1)).toEqual(250);
        expect(resolutionConstraint(50, 1)).toEqual(100);
      });
    });

    describe('direction -1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1050, -1)).toEqual(1000);
        expect(resolutionConstraint(950, -1)).toEqual(500);
        expect(resolutionConstraint(550, -1)).toEqual(500);
        expect(resolutionConstraint(450, -1)).toEqual(250);
        expect(resolutionConstraint(300, -1)).toEqual(250);
        expect(resolutionConstraint(200, -1)).toEqual(100);
        expect(resolutionConstraint(150, -1)).toEqual(100);
        expect(resolutionConstraint(50, -1)).toEqual(100);
      });
    });
  });

  describe('createSnapToPower', () => {

    let resolutionConstraint;

    beforeEach(() => {
      resolutionConstraint =
          createSnapToPower(2, 1024, 1);
    });

    describe('delta 0', () => {
      test('returns expected resolution value', () => {
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

    describe('direction 1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1024, 1)).toEqual(1024);
        expect(resolutionConstraint(512, 1)).toEqual(512);
        expect(resolutionConstraint(256, 1)).toEqual(256);
        expect(resolutionConstraint(128, 1)).toEqual(128);
        expect(resolutionConstraint(64, 1)).toEqual(64);
        expect(resolutionConstraint(32, 1)).toEqual(32);
        expect(resolutionConstraint(16, 1)).toEqual(16);
        expect(resolutionConstraint(8, 1)).toEqual(8);
        expect(resolutionConstraint(4, 1)).toEqual(4);
        expect(resolutionConstraint(2, 1)).toEqual(2);
        expect(resolutionConstraint(1, 1)).toEqual(1);
      });
    });

    describe('direction -1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1024, -1)).toEqual(1024);
        expect(resolutionConstraint(512, -1)).toEqual(512);
        expect(resolutionConstraint(256, -1)).toEqual(256);
        expect(resolutionConstraint(128, -1)).toEqual(128);
        expect(resolutionConstraint(64, -1)).toEqual(64);
        expect(resolutionConstraint(32, -1)).toEqual(32);
        expect(resolutionConstraint(16, -1)).toEqual(16);
        expect(resolutionConstraint(8, -1)).toEqual(8);
        expect(resolutionConstraint(4, -1)).toEqual(4);
        expect(resolutionConstraint(2, -1)).toEqual(2);
        expect(resolutionConstraint(1, -1)).toEqual(1);
      });
    });
  });

  describe('createSnapToPower Nearest', () => {

    let resolutionConstraint;

    beforeEach(() => {
      resolutionConstraint =
          createSnapToPower(2, 1024, 1);
    });

    describe('direction 0', () => {
      test('returns expected resolution value', () => {
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

    describe('direction 1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1050, 1)).toEqual(1024);
        expect(resolutionConstraint(9050, 1)).toEqual(1024);
        expect(resolutionConstraint(550, 1)).toEqual(1024);
        expect(resolutionConstraint(450, 1)).toEqual(512);
        expect(resolutionConstraint(300, 1)).toEqual(512);
        expect(resolutionConstraint(250, 1)).toEqual(256);
        expect(resolutionConstraint(150, 1)).toEqual(256);
        expect(resolutionConstraint(100, 1)).toEqual(128);
        expect(resolutionConstraint(75, 1)).toEqual(128);
        expect(resolutionConstraint(50, 1)).toEqual(64);
        expect(resolutionConstraint(40, 1)).toEqual(64);
        expect(resolutionConstraint(30, 1)).toEqual(32);
        expect(resolutionConstraint(20, 1)).toEqual(32);
        expect(resolutionConstraint(12, 1)).toEqual(16);
        expect(resolutionConstraint(9, 1)).toEqual(16);
        expect(resolutionConstraint(7, 1)).toEqual(8);
        expect(resolutionConstraint(5, 1)).toEqual(8);
        expect(resolutionConstraint(3.5, 1)).toEqual(4);
        expect(resolutionConstraint(2.1, 1)).toEqual(4);
        expect(resolutionConstraint(1.9, 1)).toEqual(2);
        expect(resolutionConstraint(1.1, 1)).toEqual(2);
        expect(resolutionConstraint(0.9, 1)).toEqual(1);
      });
    });

    describe('direction -1', () => {
      test('returns expected resolution value', () => {
        expect(resolutionConstraint(1050, -1)).toEqual(1024);
        expect(resolutionConstraint(9050, -1)).toEqual(1024);
        expect(resolutionConstraint(550, -1)).toEqual(512);
        expect(resolutionConstraint(450, -1)).toEqual(256);
        expect(resolutionConstraint(300, -1)).toEqual(256);
        expect(resolutionConstraint(250, -1)).toEqual(128);
        expect(resolutionConstraint(150, -1)).toEqual(128);
        expect(resolutionConstraint(100, -1)).toEqual(64);
        expect(resolutionConstraint(75, -1)).toEqual(64);
        expect(resolutionConstraint(50, -1)).toEqual(32);
        expect(resolutionConstraint(40, -1)).toEqual(32);
        expect(resolutionConstraint(30, -1)).toEqual(16);
        expect(resolutionConstraint(20, -1)).toEqual(16);
        expect(resolutionConstraint(12, -1)).toEqual(8);
        expect(resolutionConstraint(9, -1)).toEqual(8);
        expect(resolutionConstraint(7, -1)).toEqual(4);
        expect(resolutionConstraint(5, -1)).toEqual(4);
        expect(resolutionConstraint(3.5, -1)).toEqual(2);
        expect(resolutionConstraint(2.1, -1)).toEqual(2);
        expect(resolutionConstraint(1.9, -1)).toEqual(1);
        expect(resolutionConstraint(1.1, -1)).toEqual(1);
        expect(resolutionConstraint(0.9, -1)).toEqual(1);
      });
    });
  });

  describe('SnapToPower smooth constraint', () => {

    describe('snap to power, smooth constraint on', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createSnapToPower(2, 128, 16, true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeLessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeLessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeGreaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeLessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeGreaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeLessThan(16);
      });
    });

    describe('snap to power, smooth constraint off', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createSnapToPower(2, 128, 16, false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toEqual(16);
      });
    });

    describe('snap to resolutions, smooth constraint on', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createSnapToResolutions([128, 64, 32, 16], true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeLessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeLessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeGreaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeLessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeGreaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeLessThan(16);
      });
    });

    describe('snap to resolutions, smooth constraint off', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createSnapToResolutions([128, 64, 32, 16], false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toEqual(16);
      });
    });

    describe('min/max, smooth constraint on', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createMinMaxResolution(128, 16, true);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(150, 0, [100, 100], true)).toBeLessThan(150);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeGreaterThan(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toBeLessThan(130);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeGreaterThan(15);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toBeLessThan(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeGreaterThan(10);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toBeLessThan(16);
      });
    });

    describe('min/max, smooth constraint off', () => {
      test('returns expected resolution value', () => {
        const resolutionConstraint = createMinMaxResolution(128, 16, false);

        expect(resolutionConstraint(150, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(130, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(128, 0, [100, 100], true)).toEqual(128);
        expect(resolutionConstraint(16, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(15, 0, [100, 100], true)).toEqual(16);
        expect(resolutionConstraint(10, 0, [100, 100], true)).toEqual(16);
      });
    });
  });

});
