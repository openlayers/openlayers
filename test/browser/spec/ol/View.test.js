import {assert} from 'chai';
import Map from '../../../../src/ol/Map.js';
import View, {
  createCenterConstraint,
  createResolutionConstraint,
  createRotationConstraint,
  isNoopAnimation,
} from '../../../../src/ol/View.js';
import ViewHint from '../../../../src/ol/ViewHint.js';
import {createEmpty} from '../../../../src/ol/extent.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import {clearUserProjection, useGeographic} from '../../../../src/ol/proj.js';

describe('ol/View', function () {
  describe('constructor (defaults)', function () {
    let view;

    beforeEach(function () {
      view = new View();
    });

    it('creates an instance', function () {
      assert.instanceOf(view, View);
    });

    it('provides default rotation', function () {
      assert.strictEqual(view.getRotation(), 0);
    });
  });

  describe('parameter initialization with resolution/zoom constraints', function () {
    it('correctly handles max resolution constraint', function () {
      const view = new View({
        maxResolution: 1000,
        resolution: 1200,
      });
      view.setViewportSize();
      assert.deepEqual(view.getResolution(), 1000);
      assert.deepEqual(view.targetResolution_, 1000);
    });

    it('correctly handles min resolution constraint', function () {
      const view = new View({
        maxResolution: 1024,
        minResolution: 128,
        resolution: 50,
      });
      view.setViewportSize();
      assert.deepEqual(view.getResolution(), 128);
      assert.deepEqual(view.targetResolution_, 128);
    });

    it('correctly handles resolutions array constraint', function () {
      let view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32],
        resolution: 1200,
      });
      view.setViewportSize();
      assert.deepEqual(view.getResolution(), 1024);
      assert.deepEqual(view.targetResolution_, 1024);

      view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32],
        resolution: 10,
      });
      view.setViewportSize();
      assert.deepEqual(view.getResolution(), 32);
      assert.deepEqual(view.targetResolution_, 32);
    });

    it('correctly handles min zoom constraint', function () {
      const view = new View({
        minZoom: 3,
        zoom: 2,
      });
      view.setViewportSize();
      assert.deepEqual(view.getZoom(), 3);
      assert.deepEqual(view.targetResolution_, view.getMaxResolution());
    });

    it('correctly handles max zoom constraint', function () {
      const view = new View({
        maxZoom: 4,
        zoom: 5,
      });
      view.setViewportSize();
      assert.deepEqual(view.getZoom(), 4);
      assert.deepEqual(
        view.targetResolution_,
        view.getMaxResolution() / Math.pow(2, 4),
      );
    });

    it('correctly handles extent constraint', function () {
      // default viewport size is 100x100
      const view = new View({
        extent: [0, 0, 50, 50],
        resolution: 1,
      });
      view.setViewportSize();
      assert.deepEqual(view.getResolution(), 0.5);
      assert.deepEqual(view.targetResolution_, 0.5);
    });
  });

  describe('create constraints', function () {
    describe('create center constraint', function () {
      describe('with no options', function () {
        it('gives a correct center constraint function', function () {
          const options = {};
          const size = [512, 256];
          const resolution = 1e5;
          const fn = createCenterConstraint(options);
          assert.deepEqual(fn([0, 0], resolution, size), [0, 0]);
          assert.deepEqual(fn([42, -100], resolution, size), [42, -100]);
        });
      });

      describe('panning off the edge of the world', function () {
        it('disallows going north off the world', function () {
          const options = {
            projection: 'EPSG:4326',
          };
          const size = [360, 180];
          const resolution = 0.5;
          const fn = createCenterConstraint(options);
          assert.deepEqual(fn([0, 0], resolution, size), [0, 0]);
          assert.deepEqual(fn([0, 60], resolution, size), [0, 45]);
          assert.deepEqual(fn([180, 60], resolution, size), [180, 45]);
          assert.deepEqual(fn([-180, 60], resolution, size), [-180, 45]);
        });

        it('disallows going south off the world', function () {
          const options = {
            projection: 'EPSG:4326',
          };
          const size = [360, 180];
          const resolution = 0.5;
          const fn = createCenterConstraint(options);
          assert.deepEqual(fn([0, 0], resolution, size), [0, 0]);
          assert.deepEqual(fn([0, -60], resolution, size), [0, -45]);
          assert.deepEqual(fn([180, -60], resolution, size), [180, -45]);
          assert.deepEqual(fn([-180, -60], resolution, size), [-180, -45]);
        });
      });

      describe('with multiWorld: true', function () {
        it('gives a correct center constraint function', function () {
          const options = {multiWorld: true};
          const size = [512, 256];
          const resolution = 1e5;
          const fn = createCenterConstraint(options);
          assert.deepEqual(fn([0, 0], resolution, size), [0, 0]);
          assert.deepEqual(fn([42, -100], resolution, size), [42, -100]);
        });
      });

      describe('with extent option and center only', function () {
        it('gives a correct center constraint function', function () {
          const options = {
            extent: [0, 0, 1, 1],
            constrainOnlyCenter: true,
          };
          const fn = createCenterConstraint(options);
          assert.deepEqual(fn([0, 0]), [0, 0]);
          assert.deepEqual(fn([-10, 0]), [0, 0]);
          assert.deepEqual(fn([100, 100]), [1, 1]);
        });
      });

      describe('with extent option', function () {
        it('gives a correct center constraint function', function () {
          const options = {
            extent: [0, 0, 1, 1],
          };
          const fn = createCenterConstraint(options);
          const res = 1;
          const size = [0.15, 0.1];
          assert.deepEqual(fn([0, 0], res, size), [0.075, 0.05]);
          assert.deepEqual(fn([0.5, 0.5], res, size), [0.5, 0.5]);
          assert.deepEqual(fn([10, 10], res, size), [0.925, 0.95]);

          const overshootCenter = fn([10, 10], res, size, true);
          assert.deepEqual(overshootCenter[0] > 0.925, true);
          assert.deepEqual(overshootCenter[1] > 0.95, true);
          assert.deepEqual(overshootCenter[0] < 9, true);
          assert.deepEqual(overshootCenter[1] < 9, true);
        });
      });
    });

    describe('create resolution constraint', function () {
      describe('with no options', function () {
        const size = [200, 200];
        it('gives a correct resolution constraint function', function () {
          const options = {};
          const fn = createResolutionConstraint(options).constraint;
          assert.approximately(
            fn(156543.03392804097, 0, size),
            156543.03392804097,
            1e-9,
          );
          assert.approximately(
            fn(78271.51696402048, 0, size),
            78271.51696402048,
            1e-10,
          );
        });
      });

      describe('with maxResolution, maxZoom, and zoomFactor options', function () {
        const size = [200, 200];
        it('gives a correct resolution constraint function', function () {
          const options = {
            maxResolution: 81,
            maxZoom: 3,
            zoomFactor: 3,
          };
          const info = createResolutionConstraint(options);
          const maxResolution = info.maxResolution;
          assert.deepEqual(maxResolution, 81);
          const minResolution = info.minResolution;
          assert.deepEqual(minResolution, 3);
          const fn = info.constraint;
          assert.deepEqual(fn(82, 0, size), 81);
          assert.deepEqual(fn(81, 0, size), 81);
          assert.deepEqual(fn(27, 0, size), 27);
          assert.deepEqual(fn(9, 0, size), 9);
          assert.deepEqual(fn(3, 0, size), 3);
          assert.deepEqual(fn(2, 0, size), 3);
        });
      });

      describe('with resolutions', function () {
        const size = [200, 200];
        it('gives a correct resolution constraint function', function () {
          const options = {
            resolutions: [97, 76, 65, 54, 0.45],
          };
          const info = createResolutionConstraint(options);
          const maxResolution = info.maxResolution;
          assert.deepEqual(maxResolution, 97);
          const minResolution = info.minResolution;
          assert.deepEqual(minResolution, 0.45);
          const fn = info.constraint;
          assert.deepEqual(fn(97, 0, size), 97);
          assert.deepEqual(fn(76, 0, size), 76);
          assert.deepEqual(fn(65, 0, size), 65);
          assert.deepEqual(fn(54, 0, size), 54);
          assert.deepEqual(fn(0.45, 0, size), 0.45);
        });
      });

      describe('with zoom related options', function () {
        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('works with only maxZoom', function () {
          const maxZoom = 10;
          const constraint = getConstraint({
            maxZoom: maxZoom,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes,
            1e-9,
          );

          assert.approximately(
            constraint(0, 0, size),
            defaultMaxRes / Math.pow(2, maxZoom),
            1e-9,
          );
        });

        it('works with only minZoom', function () {
          const minZoom = 5;
          const constraint = getConstraint({
            minZoom: minZoom,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes / Math.pow(2, minZoom),
            1e-9,
          );

          assert.approximately(
            constraint(0, 0, size),
            defaultMaxRes / Math.pow(2, 28),
            1e-9,
          );
        });

        it('works with maxZoom and minZoom', function () {
          const minZoom = 2;
          const maxZoom = 11;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes / Math.pow(2, minZoom),
            1e-9,
          );

          assert.approximately(
            constraint(0, 0, size),
            defaultMaxRes / Math.pow(2, maxZoom),
            1e-9,
          );
        });

        it('works with maxZoom, minZoom, and zoomFactor', function () {
          const minZoom = 4;
          const maxZoom = 8;
          const zoomFactor = 3;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom,
            zoomFactor: zoomFactor,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes / Math.pow(zoomFactor, minZoom),
            1e-9,
          );

          assert.approximately(
            constraint(0, 0, size),
            defaultMaxRes / Math.pow(zoomFactor, maxZoom),
            1e-9,
          );
        });
      });

      describe('with resolution related options', function () {
        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('works with only maxResolution', function () {
          const maxResolution = 10e6;
          const constraint = getConstraint({
            multiWorld: true,
            maxResolution: maxResolution,
          });

          assert.approximately(
            constraint(maxResolution * 3, 0, size),
            maxResolution,
            1e-9,
          );

          const minResolution = constraint(0, 0, size);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          assert.isAbove(minResolution, defaultMinRes);
          assert.isBelow(minResolution / defaultMinRes, 2);
        });

        it('works with only minResolution', function () {
          const minResolution = 100;
          const constraint = getConstraint({
            minResolution: minResolution,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes,
            1e-9,
          );

          const constrainedMinRes = constraint(0, 0, size);
          assert.isAbove(constrainedMinRes, minResolution);
          assert.isBelow(constrainedMinRes / minResolution, 2);
        });

        it('works with minResolution and maxResolution', function () {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 100,
            constrainResolution: true,
          });

          assert.strictEqual(constraint(600, 0, size), 500);
          assert.strictEqual(constraint(500, 0, size), 500);
          assert.strictEqual(constraint(400, 0, size), 500);
          assert.strictEqual(constraint(300, 0, size), 250);
          assert.strictEqual(constraint(200, 0, size), 250);
          assert.strictEqual(constraint(100, 0, size), 125);
          assert.strictEqual(constraint(0, 0, size), 125);
        });

        it('accepts minResolution, maxResolution, and zoomFactor', function () {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 1,
            zoomFactor: 10,
            constrainResolution: true,
          });

          assert.strictEqual(constraint(1000, 0, size), 500);
          assert.strictEqual(constraint(500, 0, size), 500);
          assert.strictEqual(constraint(100, 0, size), 50);
          assert.strictEqual(constraint(50, 0, size), 50);
          assert.strictEqual(constraint(10, 0, size), 5);
          assert.strictEqual(constraint(1, 0, size), 5);
        });

        it('accepts extent and uses the smallest value', function () {
          const constraint = getConstraint({
            extent: [0, 0, 4000, 6000],
          });

          assert.strictEqual(constraint(1000, 0, size), 20);
          assert.strictEqual(constraint(500, 0, size), 20);
          assert.strictEqual(constraint(100, 0, size), 20);
          assert.strictEqual(constraint(50, 0, size), 20);
          assert.strictEqual(constraint(10, 0, size), 10);
          assert.strictEqual(constraint(1, 0, size), 1);
        });

        it('accepts extent and showFullExtent and uses the larger value', function () {
          const constraint = getConstraint({
            extent: [0, 0, 4000, 6000],
            showFullExtent: true,
          });

          assert.strictEqual(constraint(1000, 0, size), 30);
          assert.strictEqual(constraint(500, 0, size), 30);
          assert.strictEqual(constraint(100, 0, size), 30);
          assert.strictEqual(constraint(50, 0, size), 30);
          assert.strictEqual(constraint(10, 0, size), 10);
          assert.strictEqual(constraint(1, 0, size), 1);
        });
      });

      describe('overspecified options (prefers resolution)', function () {
        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('respects maxResolution over minZoom', function () {
          const maxResolution = 10e6;
          const minZoom = 8;
          const constraint = getConstraint({
            multiWorld: true,
            maxResolution: maxResolution,
            minZoom: minZoom,
          });

          assert.approximately(
            constraint(maxResolution * 3, 0, size),
            maxResolution,
            1e-9,
          );

          const minResolution = constraint(0, 0, size);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          assert.isAbove(minResolution, defaultMinRes);
          assert.isBelow(minResolution / defaultMinRes, 2);
        });

        it('respects minResolution over maxZoom', function () {
          const minResolution = 100;
          const maxZoom = 50;
          const constraint = getConstraint({
            minResolution: minResolution,
            maxZoom: maxZoom,
          });

          assert.approximately(
            constraint(defaultMaxRes, 0, size),
            defaultMaxRes,
            1e-9,
          );

          const constrainedMinRes = constraint(0, 0, size);
          assert.isAbove(constrainedMinRes, minResolution);
          assert.isBelow(constrainedMinRes / minResolution, 2);
        });
      });

      describe('Map views that show more than one world', function () {
        const defaultMaxRes = 156543.03392804097;
        const size = [512, 512];
        const maxResolution = 160000;
        const resolutions = [160000, 80000, 40000, 20000, 10000, 5000];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('are disabled by default', function () {
          const fn = getConstraint({});
          assert.strictEqual(fn(defaultMaxRes, 0, size), defaultMaxRes / 2);
        });

        it('can be enabled by setting multiWorld to true', function () {
          const fn = getConstraint({
            multiWorld: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), defaultMaxRes);
        });

        it('disabled, with constrainResolution', function () {
          const fn = getConstraint({
            maxResolution: maxResolution,
            constrainResolution: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), maxResolution / 4);
        });

        it('enabled, with constrainResolution', function () {
          const fn = getConstraint({
            maxResolution: maxResolution,
            constrainResolution: true,
            multiWorld: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), maxResolution);
        });

        it('disabled, with resolutions array', function () {
          const fn = getConstraint({
            resolutions: resolutions,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), defaultMaxRes / 2);
        });

        it('enabled, with resolutions array', function () {
          const fn = getConstraint({
            resolutions: resolutions,
            multiWorld: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), defaultMaxRes);
        });

        it('disabled, with resolutions array and constrainResolution', function () {
          const fn = getConstraint({
            resolutions: resolutions,
            constrainResolution: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), resolutions[2]);
        });

        it('enabled, with resolutions array and constrainResolution', function () {
          const fn = getConstraint({
            resolutions: resolutions,
            constrainResolution: true,
            multiWorld: true,
          });
          assert.strictEqual(fn(defaultMaxRes, 0, size), resolutions[0]);
        });
      });
    });

    describe('create rotation constraint', function () {
      it('gives a correct rotation constraint function', function () {
        const options = {};
        const fn = createRotationConstraint(options);
        assert.deepEqual(fn(0.01, 0), 0);
        assert.deepEqual(fn(0.15, 0), 0.15);
      });
    });
  });

  describe('#setResolution()', function () {
    it('does not change center when set to undefined', function () {
      const center = [1, 1];
      const view = new View({
        center: center.slice(),
        resolution: 1,
      });
      view.setResolution(undefined);
      assert.deepEqual(view.getCenter(), center);
    });
  });

  describe('#setCenter()', function () {
    it('allows setting undefined center', function () {
      const view = new View({
        center: [0, 0],
        resolution: 1,
      });
      view.setCenter(undefined);
      assert.strictEqual(view.getCenter(), undefined);
    });
  });

  describe('#setHint()', function () {
    it('changes a view hint', function () {
      const view = new View({
        center: [0, 0],
        zoom: 0,
      });

      assert.deepEqual(view.getHints(), [0, 0]);
      assert.deepEqual(view.getInteracting(), false);

      view.setHint(ViewHint.INTERACTING, 1);
      assert.deepEqual(view.getHints(), [0, 1]);
      assert.deepEqual(view.getInteracting(), true);
    });

    it('triggers the change event', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        view.on('change', function () {
          assert.deepEqual(view.getHints(), [0, 1]);
          assert.deepEqual(view.getInteracting(), true);
          resolve();
        });
        view.setHint(ViewHint.INTERACTING, 1);
      }));
  });

  describe('#getUpdatedOptions_()', function () {
    it('applies minZoom to constructor options', function () {
      const view = new View({
        center: [0, 0],
        minZoom: 2,
        zoom: 10,
      });
      const options = view.getUpdatedOptions_({minZoom: 3});

      assert.deepEqual(options.center, [0, 0]);
      assert.deepEqual(options.minZoom, 3);
      assert.deepEqual(options.zoom, 10);
    });

    it('returns the current properties with getProperties()', function () {
      const view = new View({
        center: [0, 0],
        minZoom: 2,
        zoom: 10,
      });
      view.setZoom(8);
      view.setCenter([1, 2]);
      view.setRotation(1);

      const options = view.getProperties();
      assert.deepEqual(options.minZoom, 2);
      assert.deepEqual(options.zoom, 8);
      assert.deepEqual(options.center, [1, 2]);
      assert.deepEqual(options.rotation, 1);
    });

    it('applies the current zoom', function () {
      const view = new View({
        center: [0, 0],
        zoom: 10,
      });
      view.setZoom(8);
      const options = view.getUpdatedOptions_();

      assert.deepEqual(options.center, [0, 0]);
      assert.deepEqual(options.zoom, 8);
    });

    it('applies the current resolution if resolution was originally supplied', function () {
      const view = new View({
        center: [0, 0],
        maxResolution: 2000,
        resolution: 1000,
      });
      view.setResolution(500);
      const options = view.getUpdatedOptions_();

      assert.deepEqual(options.center, [0, 0]);
      assert.deepEqual(options.resolution, 500);
    });

    it('applies the current center', function () {
      const view = new View({
        center: [0, 0],
        zoom: 10,
      });
      view.setCenter([1, 2]);
      const options = view.getUpdatedOptions_();

      assert.deepEqual(options.center, [1, 2]);
      assert.deepEqual(options.zoom, 10);
    });

    it('applies the current rotation', function () {
      const view = new View({
        center: [0, 0],
        zoom: 10,
      });
      view.setRotation(Math.PI / 6);
      const options = view.getUpdatedOptions_();

      assert.deepEqual(options.center, [0, 0]);
      assert.deepEqual(options.zoom, 10);
      assert.deepEqual(options.rotation, Math.PI / 6);
    });
  });

  describe('#animate()', function () {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function () {
      window.requestAnimationFrame = function (callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function (key) {
        return clearTimeout(key);
      };
    });

    afterEach(function () {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    it('can be called to animate view properties', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 5,
        });

        view.animate(
          {
            zoom: 4,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.strictEqual(isNaN(view.nextResolution_), true);
            assert.deepEqual(view.getCenter(), [0, 0]);
            assert.deepEqual(view.getZoom(), 4);
            assert.strictEqual(view.getAnimating(), false);
            resolve();
          },
        );
        assert.deepEqual(view.getAnimating(), true);
        assert.strictEqual(isNaN(view.nextResolution_), false);
      }));

    it('allows duration to be zero', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 5,
        });

        view.animate(
          {
            zoom: 4,
            duration: 0,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.deepEqual(view.getCenter(), [0, 0]);
            assert.deepEqual(view.getZoom(), 4);
            assert.deepEqual(view.getAnimating(), false);
            resolve();
          },
        );
      }));

    it('immediately completes for no-op animations', function () {
      const view = new View({
        center: [0, 0],
        zoom: 5,
      });

      view.animate({
        zoom: 5,
        center: [0, 0],
        duration: 25,
      });
      assert.deepEqual(view.getAnimating(), false);
    });

    describe('Set final animation state if view is not defined.', function () {
      it('immediately completes if view is not defined before', function () {
        const view = new View();
        const center = [1, 2];
        const zoom = 3;
        const rotation = 0.4;

        view.animate({
          zoom: zoom,
          center: center,
          rotation: rotation,
          duration: 25,
        });
        assert.deepEqual(view.getAnimating(), false);
        assert.deepEqual(view.getCenter(), center);
        assert.deepEqual(view.getZoom(), zoom);
        assert.deepEqual(view.getRotation(), rotation);
      });

      it('prefers zoom over resolution', function () {
        const view = new View();
        const zoom = 1;
        view.animate({
          center: [0, 0],
          zoom: zoom,
          resolution: 1,
        });
        assert.deepEqual(view.getZoom(), zoom);
      });

      it('uses all animation steps to get final state', function () {
        const view = new View();

        const center = [1, 2];
        const resolution = 3;
        const rotation = 0.4;

        view.animate(
          {center: [2, 3]},
          {
            center: center,
            rotation: 4,
          },
          {
            rotation: rotation,
          },
          {resolution: resolution},
        );
        assert.strictEqual(view.getAnimating(), false);
        assert.deepEqual(view.getCenter(), center);
        assert.strictEqual(view.getResolution(), resolution);
        assert.strictEqual(view.getRotation(), rotation);
      });

      it('animates remaining steps after it becomes defined', function () {
        const view = new View();

        const center = [1, 2];
        const resolution = 3;

        view.animate(
          {center: [2, 3]},
          {
            resolution: resolution,
            center: center,
          },
          {
            rotation: 2,
            duration: 25,
          },
        );
        assert.strictEqual(view.getAnimating(), true);
        assert.deepEqual(view.getCenter(), center);
        assert.strictEqual(view.getResolution(), resolution);
        assert.approximately(view.getRotation(), 0, 0.02);
      });
    });

    it('prefers zoom over resolution', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 5,
        });

        view.animate(
          {
            zoom: 4,
            resolution: view.getResolution() * 3,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.strictEqual(view.getZoom(), 4);
            resolve();
          },
        );
      }));

    it('avoids going under minResolution', () =>
      new Promise((resolve) => {
        const maxZoom = 14;
        const view = new View({
          center: [0, 0],
          zoom: 0,
          maxZoom: maxZoom,
        });

        const minResolution = view.getMinResolution();
        view.animate(
          {
            resolution: minResolution,
            duration: 10,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.strictEqual(view.getResolution(), minResolution);
            assert.strictEqual(view.getZoom(), maxZoom);
            resolve();
          },
        );
      }));

    it('takes the shortest arc to the target rotation', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: (Math.PI / 180) * 1,
        });
        view.animate(
          {
            rotation: (Math.PI / 180) * 359,
            duration: 0,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.approximately(
              view.getRotation(),
              (Math.PI / 180) * -1,
              1e-12,
            );
            resolve();
          },
        );
      }));

    it('normalizes rotation to angles between -180 and 180 degrees after the anmiation', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: (Math.PI / 180) * 1,
        });
        view.animate(
          {
            rotation: (Math.PI / 180) * -181,
            duration: 0,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            assert.approximately(
              view.getRotation(),
              (Math.PI / 180) * 179,
              1e-12,
            );
            resolve();
          },
        );
      }));

    it('calls a callback when animation completes', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            resolve();
          },
        );
      }));

    it('allows the callback to trigger another animation', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        function firstCallback(complete) {
          assert.strictEqual(complete, true);

          view.animate(
            {
              zoom: 2,
              duration: 10,
            },
            secondCallback,
          );
        }

        function secondCallback(complete) {
          assert.strictEqual(complete, true);
          resolve();
        }

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          firstCallback,
        );
      }));

    it('calls callback with false when animation is interrupted', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(complete, false);
            resolve();
          },
        );

        view.setCenter([1, 2]); // interrupt the animation
      }));

    it('calls a callback even if animation is a no-op', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        view.animate(
          {
            zoom: 0,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(complete, true);
            resolve();
          },
        );
      }));

    it('calls a callback if view is not defined before', () =>
      new Promise((resolve) => {
        const view = new View();

        view.animate(
          {
            zoom: 10,
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(view.getZoom(), 10);
            assert.strictEqual(complete, true);
            resolve();
          },
        );
      }));

    it('can run multiple animations in series', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        let checked = false;

        view.animate(
          {
            zoom: 2,
            duration: 25,
          },
          {
            center: [10, 10],
            duration: 25,
          },
          function (complete) {
            assert.strictEqual(checked, true);
            assert.approximately(view.getZoom(), 2, 1e-5);
            assert.deepEqual(view.getCenter(), [10, 10]);
            assert.strictEqual(complete, true);
            resolve();
          },
        );

        setTimeout(function () {
          assert.deepEqual(view.getCenter(), [0, 0]);
          checked = true;
        }, 10);
      }));

    it('properly sets the ANIMATING hint', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: 0,
        });

        let count = 3;
        function decrement() {
          --count;
          if (count === 0) {
            assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 0);
            resolve();
          }
        }
        view.animate(
          {
            center: [1, 2],
            duration: 25,
          },
          decrement,
        );
        assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 1);

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          decrement,
        );
        assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 2);

        view.animate(
          {
            rotation: Math.PI,
            duration: 25,
          },
          decrement,
        );
        assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 3);
      }));

    it('clears the ANIMATING hint when animations are cancelled', function () {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0,
      });

      view.animate({
        center: [1, 2],
        duration: 25,
      });
      assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 1);

      view.animate({
        zoom: 1,
        duration: 25,
      });
      assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 2);

      view.animate({
        rotation: Math.PI,
        duration: 25,
      });
      assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 3);

      // cancel animations
      view.setCenter([10, 20]);
      assert.strictEqual(view.getHints()[ViewHint.ANIMATING], 0);
    });

    it('completes multiple staggered animations run in parallel', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        let calls = 0;

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          function () {
            ++calls;
          },
        );

        setTimeout(function () {
          assert.strictEqual(view.getZoom() > 0, true);
          assert.strictEqual(view.getZoom() < 1, true);
          assert.strictEqual(view.getAnimating(), true);
          view.animate(
            {
              zoom: 2,
              duration: 50,
            },
            function () {
              assert.strictEqual(calls, 1);
              assert.strictEqual(view.getZoom(), 2);
              assert.strictEqual(view.getAnimating(), false);
              resolve();
            },
          );
        }, 10);
      }));

    it('completes complex animation using resolution', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          resolution: 2,
        });

        let calls = 0;

        function onAnimateEnd() {
          if (calls == 2) {
            assert.strictEqual(view.getAnimating(), false);
            resolve();
          }
        }

        view.animate(
          {
            center: [100, 100],
            duration: 50,
          },
          function () {
            ++calls;
            assert.deepEqual(view.getCenter(), [100, 100]);
            onAnimateEnd();
          },
        );

        view.animate(
          {
            resolution: 2000,
            duration: 25,
          },
          {
            resolution: 2,
            duration: 25,
          },
          function () {
            ++calls;
            assert.strictEqual(view.getResolution(), 2);
            onAnimateEnd();
          },
        );

        setTimeout(function () {
          assert.strictEqual(view.getResolution() > 2, true);
          assert.strictEqual(view.getResolution() < 2000, true);
          assert.strictEqual(view.getAnimating(), true);
        }, 10);

        setTimeout(function () {
          assert.strictEqual(view.getResolution() > 2, true);
          assert.strictEqual(view.getResolution() < 2000, true);
          assert.strictEqual(view.getAnimating(), true);
        }, 40);
      }));

    it('completes even though Map#setSize is called', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });
        const map = new Map({
          view,
        });
        map.setSize([110, 90]);

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          function () {
            assert.strictEqual(view.getZoom(), 1);
            resolve();
          },
        );

        setTimeout(function () {
          map.setSize([100, 100]);
        }, 10);
      }));

    it('completes even though Map#updateSize is called', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });
        const map = new Map({
          view,
        });

        view.animate(
          {
            zoom: 1,
            duration: 25,
          },
          function () {
            assert.strictEqual(view.getZoom(), 1);
            resolve();
          },
        );

        setTimeout(function () {
          map.updateSize();
        }, 10);
      }));
  });

  describe('#cancelAnimations()', function () {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function () {
      window.requestAnimationFrame = function (callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function (key) {
        return clearTimeout(key);
      };
    });

    afterEach(function () {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    it('cancels a currently running animation', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: 0,
        });

        view.animate({
          rotation: 10,
          duration: 50,
        });

        setTimeout(function () {
          assert.strictEqual(view.getAnimating(), true);
          view.once('change', function () {
            assert.strictEqual(view.getAnimating(), false);
            resolve();
          });
          view.cancelAnimations();
        }, 10);
      }));

    it('cancels a multiple animations', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: 0,
        });

        view.animate(
          {
            rotation: 10,
            duration: 50,
          },
          {
            zoom: 10,
            duration: 50,
          },
        );

        view.animate({
          center: [10, 30],
          duration: 100,
        });

        setTimeout(function () {
          assert.strictEqual(view.getAnimating(), true);
          view.once('change', function () {
            assert.strictEqual(view.getAnimating(), false);
            resolve();
          });
          view.cancelAnimations();
        }, 10);
      }));

    it('calls callbacks with false to indicate animations did not complete', () =>
      new Promise((resolve) => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
        });

        view.animate(
          {
            zoom: 10,
            duration: 50,
          },
          function (complete) {
            assert.strictEqual(view.getAnimating(), false);
            assert.strictEqual(complete, false);
            resolve();
          },
        );

        setTimeout(function () {
          assert.strictEqual(view.getAnimating(), true);
          view.cancelAnimations();
        }, 10);
      }));
  });

  describe('#getResolutions', function () {
    let view;
    const resolutions = [512, 256, 128, 64, 32, 16];

    it('returns correct resolutions', function () {
      view = new View({
        resolutions: resolutions,
      });
      assert.strictEqual(view.getResolutions(), resolutions);
    });

    it('returns resolutions as undefined', function () {
      view = new View();
      assert.strictEqual(view.getResolutions(), undefined);
    });
  });

  describe('#getZoom', function () {
    let view;
    beforeEach(function () {
      view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32, 16, 8],
      });
    });

    it('returns correct zoom levels (with resolutions array)', function () {
      view.setResolution(undefined);
      assert.strictEqual(view.getZoom(), undefined);

      view.setResolution(513);
      assert.approximately(
        view.getZoom(),
        Math.log(1024 / 513) / Math.LN2,
        1e-9,
      );

      view.setResolution(512);
      assert.strictEqual(view.getZoom(), 1);

      view.setResolution(100);
      assert.approximately(view.getZoom(), 3.35614, 1e-5);

      view.setResolution(65);
      assert.approximately(view.getZoom(), 3.97763, 1e-5);

      view.setResolution(64);
      assert.strictEqual(view.getZoom(), 4);

      view.setResolution(16);
      assert.strictEqual(view.getZoom(), 6);

      view.setResolution(15);
      assert.approximately(
        view.getZoom(),
        Math.log(1024 / 15) / Math.LN2,
        1e-9,
      );
    });

    it('works for resolution arrays with variable zoom factors', function () {
      const view = new View({
        resolutions: [10, 5, 2, 1],
      });

      view.setZoom(1);
      assert.strictEqual(view.getZoom(), 1);

      view.setZoom(1.3);
      assert.strictEqual(view.getZoom(), 1.3);

      view.setZoom(2);
      assert.strictEqual(view.getZoom(), 2);

      view.setZoom(2.7);
      assert.strictEqual(view.getZoom(), 2.7);

      view.setZoom(3);
      assert.strictEqual(view.getZoom(), 3);
    });
  });

  describe('#getZoom() - constrained', function () {
    it('returns correct zoom levels', function () {
      const view = new View({
        minZoom: 10,
        maxZoom: 20,
      });

      view.setZoom(5);
      assert.strictEqual(view.getZoom(), 10);

      view.setZoom(10);
      assert.strictEqual(view.getZoom(), 10);

      view.setZoom(15);
      assert.strictEqual(view.getZoom(), 15);

      view.setZoom(15.3);
      assert.strictEqual(view.getZoom(), 15.3);

      view.setZoom(20);
      assert.strictEqual(view.getZoom(), 20);

      view.setZoom(25);
      assert.strictEqual(view.getZoom(), 20);
    });
  });

  describe('#getZoom() - overspecified', function () {
    it('gives maxResolution precedence over minZoom', function () {
      const view = new View({
        maxResolution: 100,
        minZoom: 2, // this should get ignored
      });

      view.setResolution(100);
      assert.strictEqual(view.getZoom(), 0);

      view.setZoom(0);
      assert.strictEqual(view.getResolution(), 100);
    });
  });

  describe('#getZoomForResolution', function () {
    it('returns correct zoom levels', function () {
      const view = new View();
      const max = view.getMaxResolution();

      assert.strictEqual(view.getZoomForResolution(max), 0);

      assert.strictEqual(view.getZoomForResolution(max / 2), 1);

      assert.strictEqual(view.getZoomForResolution(max / 4), 2);

      assert.strictEqual(view.getZoomForResolution(2 * max), -1);
    });

    it('returns correct zoom levels for specifically configured resolutions', function () {
      const view = new View({
        resolutions: [10, 8, 6, 4, 2],
      });

      assert.strictEqual(view.getZoomForResolution(10), 0);

      assert.strictEqual(view.getZoomForResolution(8), 1);

      assert.strictEqual(view.getZoomForResolution(6), 2);

      assert.strictEqual(view.getZoomForResolution(4), 3);

      assert.strictEqual(view.getZoomForResolution(2), 4);
    });
  });

  describe('#getResolutionForZoom', function () {
    it('returns correct zoom resolution', function () {
      const view = new View();
      const max = view.getMaxZoom();
      const min = view.getMinZoom();

      assert.strictEqual(
        view.getResolutionForZoom(max),
        view.getMinResolution(),
      );
      assert.strictEqual(
        view.getResolutionForZoom(max + 1),
        view.getMinResolution() / 2,
      );
      assert.strictEqual(
        view.getResolutionForZoom(min),
        view.getMaxResolution(),
      );
      assert.strictEqual(
        view.getResolutionForZoom(min - 1),
        view.getMaxResolution() * 2,
      );
    });

    it('returns correct zoom levels for specifically configured resolutions', function () {
      const view = new View({
        resolutions: [10, 8, 6, 4, 2],
      });

      assert.strictEqual(view.getResolutionForZoom(-1), 10);
      assert.strictEqual(view.getResolutionForZoom(0), 10);
      assert.strictEqual(view.getResolutionForZoom(1), 8);
      assert.strictEqual(view.getResolutionForZoom(2), 6);
      assert.strictEqual(view.getResolutionForZoom(3), 4);
      assert.strictEqual(view.getResolutionForZoom(4), 2);
      assert.strictEqual(view.getResolutionForZoom(5), 2);
    });

    it('returns correct zoom levels for views with a single configured resolution', () => {
      const view = new View({
        resolutions: [10],
      });

      assert.strictEqual(view.getResolutionForZoom(-1), 10);
      assert.strictEqual(view.getResolutionForZoom(0), 10);
      assert.strictEqual(view.getResolutionForZoom(5), 10);
    });

    it('returns correct zoom levels for resolutions with variable zoom levels', function () {
      const view = new View({
        resolutions: [50, 10, 5, 2.5, 1.25, 0.625],
      });

      assert.strictEqual(view.getResolutionForZoom(-1), 50);
      assert.strictEqual(view.getResolutionForZoom(0), 50);
      assert.strictEqual(view.getResolutionForZoom(0.5), 50 / Math.pow(5, 0.5));
      assert.strictEqual(view.getResolutionForZoom(1), 10);
      assert.strictEqual(view.getResolutionForZoom(2), 5);
      assert.strictEqual(
        view.getResolutionForZoom(2.75),
        5 / Math.pow(2, 0.75),
      );
      assert.strictEqual(view.getResolutionForZoom(3), 2.5);
      assert.strictEqual(view.getResolutionForZoom(4), 1.25);
      assert.strictEqual(view.getResolutionForZoom(5), 0.625);
      assert.strictEqual(view.getResolutionForZoom(6), 0.625);
    });
  });

  describe('#getMaxZoom', function () {
    it('returns the zoom level for the min resolution', function () {
      const view = new View();
      assert.strictEqual(
        view.getMaxZoom(),
        view.getZoomForResolution(view.getMinResolution()),
      );
    });

    it('works for a view configured with a maxZoom', function () {
      const view = new View({
        maxZoom: 10,
      });
      assert.strictEqual(view.getMaxZoom(), 10);
    });
  });

  describe('#getMinZoom', function () {
    it('returns the zoom level for the max resolution', function () {
      const view = new View();
      assert.strictEqual(
        view.getMinZoom(),
        view.getZoomForResolution(view.getMaxResolution()),
      );
    });

    it('works for views configured with a minZoom', function () {
      const view = new View({
        minZoom: 3,
      });
      assert.strictEqual(view.getMinZoom(), 3);
    });
  });

  describe('#setMaxZoom', function () {
    describe('with resolutions property in view', function () {
      it('changes the zoom level when the level is over max zoom', function () {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4,
        });

        view.setMaxZoom(2);
        assert.strictEqual(view.getZoom(), 2);
      });
    });

    describe('with no resolutions property in view', function () {
      it('changes the zoom level when the level is over max zoom', function () {
        const view = new View({
          zoom: 4,
        });

        view.setMaxZoom(2);
        assert.strictEqual(view.getZoom(), 2);
      });
    });
  });

  describe('#setMinZoom', function () {
    describe('with resolutions property in view', function () {
      it('changes the zoom level when the level is under min zoom', function () {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4,
        });

        view.setMinZoom(5);
        assert.strictEqual(view.getZoom(), 5);
      });
    });

    describe('with no resolutions property in view', function () {
      it('changes the zoom level when the level is under min zoom', function () {
        const view = new View({
          zoom: 4,
        });

        view.setMinZoom(5);
        assert.strictEqual(view.getZoom(), 5);
      });
    });
  });

  describe('#calculateExtent', function () {
    it('returns the expected extent', function () {
      const view = new View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0],
      });

      const extent = view.calculateExtent([100, 200]);
      assert.strictEqual(extent[0], -25600);
      assert.strictEqual(extent[1], -51200);
      assert.strictEqual(extent[2], 25600);
      assert.strictEqual(extent[3], 51200);
    });
    it('returns the expected extent with rotation', function () {
      const view = new View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0],
        rotation: Math.PI / 2,
      });
      const extent = view.calculateExtent([100, 200]);
      assert.approximately(extent[0], -51200, 1e-9);
      assert.approximately(extent[1], -25600, 1e-9);
      assert.approximately(extent[2], 51200, 1e-9);
      assert.approximately(extent[3], 25600, 1e-9);
    });
    it('works with a view padding', function () {
      const view = new View({
        resolutions: [1],
        zoom: 0,
        center: [0, 0],
        padding: [10, 20, 30, 40],
      });

      let extent = view.calculateExtent();
      assert.deepEqual(extent, [-20, -30, 20, 30]);
      view.padding = [0, 0, 0, 0];
      extent = view.calculateExtent();
      assert.deepEqual(extent, [-60, -60, 40, 40]);
    });
  });

  describe('#getViewportSize_()', function () {
    let map, target;
    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '200px';
      target.style.height = '150px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
      });
    });
    afterEach(function () {
      disposeMap(map);
    });
    it('correctly initializes the viewport size', function () {
      const size = map.getView().getViewportSize_();
      assert.deepEqual(size, [200, 150]);
    });
    it('correctly updates the viewport size', function () {
      target.style.width = '300px';
      target.style.height = '200px';
      map.updateSize();
      const size = map.getView().getViewportSize_();
      assert.deepEqual(size, [300, 200]);
    });
    it('calculates the size correctly', function () {
      let size = map.getView().getViewportSize_(Math.PI / 2);
      assert.approximately(size[0], 150, 1e-9);
      assert.approximately(size[1], 200, 1e-9);
      size = map.getView().getViewportSize_(Math.PI);
      assert.approximately(size[0], 200, 1e-9);
      assert.approximately(size[1], 150, 1e-9);
    });
  });

  describe('#getViewportSizeMinusPadding_()', function () {
    let map, target;
    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '200px';
      target.style.height = '150px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
      });
    });
    afterEach(function () {
      disposeMap(map);
    });
    it('same as getViewportSize_ when no padding is set', function () {
      const size = map.getView().getViewportSizeMinusPadding_();
      assert.deepEqual(size, map.getView().getViewportSize_());
    });
    it('correctly updates when the padding is changed', function () {
      map.getView().padding = [1, 2, 3, 4];
      const size = map.getView().getViewportSizeMinusPadding_();
      assert.deepEqual(size, [194, 146]);
    });
  });

  describe('fit', function () {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function () {
      window.requestAnimationFrame = function (callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function (key) {
        return clearTimeout(key);
      };
    });

    afterEach(function () {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    let view;
    beforeEach(function () {
      view = new View({
        center: [0, 0],
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1],
        zoom: 5,
      });
      view.setViewportSize([100, 100]);
    });
    it('fits correctly to the geometry (with unconstrained resolution)', function () {
      view.fit(
        new LineString([
          [6000, 46000],
          [6000, 47100],
          [7000, 46000],
        ]),
        {size: [200, 200], padding: [100, 0, 0, 100]},
      );
      assert.strictEqual(view.getResolution(), 11);
      assert.strictEqual(view.getCenter()[0], 5950);
      assert.strictEqual(view.getCenter()[1], 47100);

      view.fit(new Circle([6000, 46000], 1000), {size: [200, 200]});
      assert.strictEqual(view.getResolution(), 10);
      assert.strictEqual(view.getCenter()[0], 6000);
      assert.strictEqual(view.getCenter()[1], 46000);

      view.setRotation(Math.PI / 8);
      view.fit(new Circle([6000, 46000], 1000), {size: [200, 200]});
      assert.approximately(view.getResolution(), 10, 1e-9);
      assert.approximately(view.getCenter()[0], 6000, 1e-9);
      assert.approximately(view.getCenter()[1], 46000, 1e-9);

      view.setRotation(Math.PI / 4);
      view.fit(
        new LineString([
          [6000, 46000],
          [6000, 47100],
          [7000, 46000],
        ]),
        {size: [200, 200], padding: [100, 0, 0, 100]},
      );
      assert.approximately(view.getResolution(), 14.849242404917458, 1e-9);
      assert.approximately(view.getCenter()[0], 5200, 1e-9);
      assert.approximately(view.getCenter()[1], 46300, 1e-9);
    });
    it('fits correctly to the geometry', function () {
      view.setConstrainResolution(true);

      view.fit(
        new LineString([
          [6000, 46000],
          [6000, 47100],
          [7000, 46000],
        ]),
        {size: [200, 200], padding: [100, 0, 0, 100]},
      );
      assert.strictEqual(view.getResolution(), 20);
      assert.strictEqual(view.getCenter()[0], 5500);
      assert.strictEqual(view.getCenter()[1], 47550);

      view.fit(
        new LineString([
          [6000, 46000],
          [6000, 47100],
          [7000, 46000],
        ]),
        {size: [200, 200], padding: [100, 0, 0, 100], nearest: true},
      );
      assert.strictEqual(view.getResolution(), 10);
      assert.strictEqual(view.getCenter()[0], 6000);
      assert.strictEqual(view.getCenter()[1], 47050);

      view.fit(new Point([6000, 46000]), {
        size: [200, 200],
        padding: [100, 0, 0, 100],
        minResolution: 2,
      });
      assert.strictEqual(view.getResolution(), 2);
      assert.strictEqual(view.getCenter()[0], 5900);
      assert.strictEqual(view.getCenter()[1], 46100);

      view.fit(new Point([6000, 46000]), {
        size: [200, 200],
        padding: [100, 0, 0, 100],
        maxZoom: 6,
      });
      assert.strictEqual(view.getResolution(), 2);
      assert.strictEqual(view.getZoom(), 6);
      assert.strictEqual(view.getCenter()[0], 5900);
      assert.strictEqual(view.getCenter()[1], 46100);
    });

    it('fits correctly to the extent', function () {
      view.fit([1000, 1000, 2000, 2000], {size: [200, 200]});
      assert.strictEqual(view.getResolution(), 5);
      assert.strictEqual(view.getCenter()[0], 1500);
      assert.strictEqual(view.getCenter()[1], 1500);
    });
    it('fits correctly to the extent when a padding is configured', function () {
      view.padding = [100, 0, 0, 100];
      view.setViewportSize([200, 200]);
      view.fit([1000, 1000, 2000, 2000]);
      assert.strictEqual(view.getResolution(), 10);
      assert.strictEqual(view.getCenter()[0], 1500);
      assert.strictEqual(view.getCenter()[1], 1500);
    });
    it('fits correctly to the extent when a view extent is configured', function () {
      view.set('extent', [1500, 0, 2500, 10000]);
      view.applyOptions_(view.getProperties());
      view.fit([1000, 1000, 2000, 2000]);
      assert.deepEqual(view.calculateExtent(), [1500, 1000, 2500, 2000]);
    });
    it('throws on invalid geometry/extent value', function () {
      assert.throws(function () {
        view.fit(true, [200, 200]);
      });
    });
    it('throws on empty extent', function () {
      assert.throws(function () {
        view.fit(createEmpty());
      });
    });
    it('animates when duration is defined', () =>
      new Promise((resolve) => {
        view.fit(
          new LineString([
            [6000, 46000],
            [6000, 47100],
            [7000, 46000],
          ]),
          {
            size: [200, 200],
            padding: [100, 0, 0, 100],
            duration: 25,
          },
        );

        assert.deepEqual(view.getAnimating(), true);

        setTimeout(function () {
          assert.strictEqual(view.getResolution(), 11);
          assert.strictEqual(view.getCenter()[0], 5950);
          assert.strictEqual(view.getCenter()[1], 47100);
          assert.deepEqual(view.getAnimating(), false);
          resolve();
        }, 50);
      }));
    it('calls a callback when duration is not defined', () =>
      new Promise((resolve) => {
        view.fit(
          new LineString([
            [6000, 46000],
            [6000, 47100],
            [7000, 46000],
          ]),
          {
            callback: function (complete) {
              assert.strictEqual(complete, true);
              resolve();
            },
          },
        );
      }));
    it('calls a callback when animation completes', () =>
      new Promise((resolve) => {
        view.fit(
          new LineString([
            [6000, 46000],
            [6000, 47100],
            [7000, 46000],
          ]),
          {
            duration: 25,
            callback: function (complete) {
              assert.strictEqual(complete, true);
              resolve();
            },
          },
        );
      }));
  });

  describe('fit async', function () {
    let view;
    beforeEach(function () {
      view = new View();
    });

    it('fits to the extent after viewport has been set', function (done) {
      let promiseResolved = false;

      view.fit([1000, 1000, 2000, 2000]).then(() => {
        promiseResolved = true;

        expect(promiseResolved).to.be(true);
        expect(view.getResolution()).to.be(10 / 3);
        expect(view.getCenter()[0]).to.be(1500);
        expect(view.getCenter()[1]).to.be(1500);
        done();
      });
      expect(view.getResolution()).to.be(undefined);
      expect(promiseResolved).to.be(false);

      view.setViewportSize([300, 300]);
    });
  });

  describe('centerOn', function () {
    let view;
    beforeEach(function () {
      view = new View({
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1],
      });
    });
    it('fit correctly to the coordinates', function () {
      view.setResolution(10);
      view.centerOn([6000, 46000], [400, 400], [300, 300]);
      assert.strictEqual(view.getCenter()[0], 5000);
      assert.strictEqual(view.getCenter()[1], 47000);

      view.setRotation(Math.PI / 4);
      view.centerOn([6000, 46000], [400, 400], [300, 300]);
      assert.approximately(view.getCenter()[0], 4585.78643762691, 1e-9);
      assert.approximately(view.getCenter()[1], 46000, 1e-9);
    });
  });

  describe('#beginInteraction() and endInteraction()', function () {
    let view;
    beforeEach(function () {
      view = new View();
    });

    it('correctly changes the view hint', function () {
      view.beginInteraction();
      assert.strictEqual(view.getHints()[1], 1);
      view.beginInteraction();
      assert.strictEqual(view.getHints()[1], 2);
      view.endInteraction();
      view.endInteraction();
      assert.strictEqual(view.getHints()[1], 0);
    });

    it('does not allow hint value to become negative', function () {
      view.beginInteraction();
      view.endInteraction();
      view.endInteraction();
      assert.strictEqual(view.getHints()[1], 0);
    });
  });

  describe('#getConstrainedZoom()', function () {
    let view;

    it('works correctly without constraint', function () {
      view = new View({
        zoom: 0,
      });
      assert.strictEqual(view.getConstrainedZoom(3), 3);
    });
    it('works correctly with resolution constraints', function () {
      view = new View({
        zoom: 4,
        minZoom: 4,
        maxZoom: 8,
      });
      assert.strictEqual(view.getConstrainedZoom(3), 4);
      assert.strictEqual(view.getConstrainedZoom(10), 8);
    });
    it('works correctly with a specific resolution set', function () {
      view = new View({
        zoom: 0,
        resolutions: [512, 256, 128, 64, 32, 16, 8],
      });
      assert.strictEqual(view.getConstrainedZoom(0), 0);
      assert.strictEqual(view.getConstrainedZoom(4), 4);
      assert.strictEqual(view.getConstrainedZoom(8), 6);
    });
  });

  describe('#getConstrainedResolution()', function () {
    let view;
    const defaultMaxRes = 156543.03392804097;

    it('works correctly by snapping to power of 2', function () {
      view = new View();
      assert.strictEqual(view.getConstrainedResolution(1000000), defaultMaxRes);
      assert.strictEqual(
        view.getConstrainedResolution(defaultMaxRes / 8),
        defaultMaxRes / 8,
      );
    });
    it('works correctly by snapping to a custom zoom factor', function () {
      view = new View({
        maxResolution: 2500,
        zoomFactor: 5,
        maxZoom: 4,
        constrainResolution: true,
      });
      assert.strictEqual(view.getConstrainedResolution(90, 1), 100);
      assert.strictEqual(view.getConstrainedResolution(90, -1), 20);
      assert.strictEqual(view.getConstrainedResolution(20), 20);
      assert.strictEqual(view.getConstrainedResolution(5), 4);
      assert.strictEqual(view.getConstrainedResolution(1), 4);
    });
    it('works correctly with a specific resolution set', function () {
      view = new View({
        zoom: 0,
        resolutions: [512, 256, 128, 64, 32, 16, 8],
        constrainResolution: true,
      });
      assert.strictEqual(view.getConstrainedResolution(1000, 1), 512);
      assert.strictEqual(view.getConstrainedResolution(260, 1), 512);
      assert.strictEqual(view.getConstrainedResolution(260), 256);
      assert.strictEqual(view.getConstrainedResolution(30), 32);
      assert.strictEqual(view.getConstrainedResolution(30, -1), 16);
      assert.strictEqual(view.getConstrainedResolution(4, -1), 8);
    });
  });

  describe('#adjustRotation()', function () {
    it('changes view rotation with anchor', function () {
      const view = new View({
        resolution: 1,
        center: [0, 0],
      });

      view.adjustRotation(Math.PI / 2);
      assert.strictEqual(view.getRotation(), Math.PI / 2);
      assert.deepEqual(view.getCenter(), [0, 0]);

      view.adjustRotation(-Math.PI);
      assert.strictEqual(view.getRotation(), -Math.PI / 2);
      assert.deepEqual(view.getCenter(), [0, 0]);

      view.adjustRotation(Math.PI / 3, [50, 0]);
      assert.approximately(view.getRotation(), -Math.PI / 6, 1e-9);
      assert.approximately(
        view.getCenter()[0],
        50 * (1 - Math.cos(Math.PI / 3)),
        1e-9,
      );
      assert.approximately(
        view.getCenter()[1],
        -50 * Math.sin(Math.PI / 3),
        1e-9,
      );
    });

    it('does not change view parameters if rotation is disabled', function () {
      const view = new View({
        resolution: 1,
        enableRotation: false,
        center: [0, 0],
      });

      view.adjustRotation(Math.PI / 2);
      assert.strictEqual(view.getRotation(), 0);
      assert.deepEqual(view.getCenter(), [0, 0]);

      view.adjustRotation(-Math.PI * 3, [-50, 0]);
      assert.strictEqual(view.getRotation(), 0);
      assert.deepEqual(view.getCenter(), [0, 0]);
    });
  });

  describe('#adjustZoom()', function () {
    it('changes view resolution', function () {
      const view = new View({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25],
      });

      view.adjustZoom(1);
      assert.strictEqual(view.getResolution(), 0.5);

      view.adjustZoom(-1);
      assert.strictEqual(view.getResolution(), 1);

      view.adjustZoom(2);
      assert.strictEqual(view.getResolution(), 0.25);

      view.adjustZoom(-2);
      assert.strictEqual(view.getResolution(), 1);
    });

    it('changes view resolution and center relative to the anchor', function () {
      const view = new View({
        center: [0, 0],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25],
      });

      view.adjustZoom(1, [10, 10]);
      assert.deepEqual(view.getCenter(), [5, 5]);

      view.adjustZoom(-1, [0, 0]);
      assert.deepEqual(view.getCenter(), [10, 10]);

      view.adjustZoom(2, [0, 0]);
      assert.deepEqual(view.getCenter(), [2.5, 2.5]);

      view.adjustZoom(-2, [0, 0]);
      assert.deepEqual(view.getCenter(), [10, 10]);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent (center only)', function () {
      const view = new View({
        center: [0, 0],
        extent: [-2.5, -2.5, 2.5, 2.5],
        constrainOnlyCenter: true,
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25],
      });

      view.adjustZoom(1, [10, 10]);
      assert.deepEqual(view.getCenter(), [2.5, 2.5]);

      view.adjustZoom(-1, [0, 0]);
      assert.deepEqual(view.getCenter(), [2.5, 2.5]);

      view.adjustZoom(2, [10, 10]);
      assert.deepEqual(view.getCenter(), [2.5, 2.5]);

      view.adjustZoom(-2, [0, 0]);
      assert.deepEqual(view.getCenter(), [2.5, 2.5]);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent', function () {
      const map = new Map({});
      const view = new View({
        center: [50, 50],
        extent: [0, 0, 100, 100],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25, 0.125],
      });
      map.setView(view);

      view.adjustZoom(1, [100, 100]);
      assert.deepEqual(view.getCenter(), [75, 75]);

      view.adjustZoom(-1, [75, 75]);
      assert.deepEqual(view.getCenter(), [50, 50]);

      view.adjustZoom(2, [100, 100]);
      assert.deepEqual(view.getCenter(), [87.5, 87.5]);

      view.adjustZoom(-3, [0, 0]);
      assert.deepEqual(view.getCenter(), [50, 50]);
      assert.deepEqual(view.getResolution(), 1);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent (rotated)', function () {
      const map = new Map({});
      const view = new View({
        center: [50, 50],
        extent: [-100, -100, 100, 100],
        resolution: 1,
        resolutions: [2, 1, 0.5, 0.25, 0.125],
        rotation: Math.PI / 4,
      });
      map.setView(view);
      const halfSize = 100 * Math.SQRT1_2;

      view.adjustZoom(1, [100, 100]);
      assert.deepEqual(view.getCenter(), [
        100 - halfSize / 2,
        100 - halfSize / 2,
      ]);

      view.setCenter([0, 50]);
      view.adjustZoom(-1, [0, 0]);
      assert.deepEqual(view.getCenter(), [0, 100 - halfSize]);
    });
  });

  describe('#adjustZoom() - useGeographic', () => {
    beforeEach(useGeographic);
    afterEach(clearUserProjection);

    it('changes view resolution', () => {
      const view = new View({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25],
      });

      view.adjustZoom(1);
      assert.strictEqual(view.getResolution(), 0.5);

      view.adjustZoom(-1);
      assert.strictEqual(view.getResolution(), 1);

      view.adjustZoom(2);
      assert.strictEqual(view.getResolution(), 0.25);

      view.adjustZoom(-2);
      assert.strictEqual(view.getResolution(), 1);
    });

    it('changes view resolution and center relative to the anchor', function () {
      const view = new View({
        center: [0, 0],
        zoom: 0,
      });

      let center;

      view.adjustZoom(1, [90, 45]);
      center = view.getCenter();
      assert.strictEqual(center[0], 45);
      assert.approximately(center[1], 24.4698, 1e-4);

      view.adjustZoom(-1, [90, 45]);
      center = view.getCenter();
      assert.approximately(center[0], 0, 1e-10);
      assert.approximately(center[1], 0, 1e-10);

      view.adjustZoom(2, [-90, -45]);
      center = view.getCenter();
      assert.strictEqual(center[0], -67.5);
      assert.approximately(center[1], -35.3836, 1e-4);

      view.adjustZoom(-2, [-90, -45]);
      center = view.getCenter();
      assert.approximately(center[0], 0, 1e-10);
      assert.approximately(center[1], 0, 1e-10);
    });
  });

  describe('#getCenter', function () {
    let view;
    beforeEach(function () {
      view = new View({
        center: [0, 0],
        resolutions: [1],
        zoom: 0,
      });
      view.setViewportSize([100, 100]);
    });
    it('Correctly shifts the viewport center when a padding is set', function () {
      view.padding = [50, 0, 0, 50];
      assert.deepEqual(view.getCenter(), [25, -25]);
    });
  });
});

describe('does not start unexpected animations during interaction', function () {
  let map;
  beforeEach(function () {
    map = new Map({
      target: createMapDiv(512, 256),
    });
  });
  afterEach(function () {
    disposeMap(map);
  });

  it('works when initialized with #setCenter() and #setZoom()', () =>
    new Promise((resolve) => {
      const view = map.getView();
      let callCount = 0;
      view.on('change:resolution', function () {
        ++callCount;
      });
      view.setCenter([0, 0]);
      view.setZoom(0);
      view.beginInteraction();
      view.endInteraction();
      setTimeout(function () {
        assert.strictEqual(callCount, 1);
        resolve();
      }, 500);
    }));

  it('works when initialized with #animate()', () =>
    new Promise((resolve) => {
      const view = map.getView();
      let callCount = 0;
      view.on('change:resolution', function () {
        ++callCount;
      });
      view.animate({
        center: [0, 0],
        zoom: 0,
      });
      view.beginInteraction();
      view.endInteraction();
      setTimeout(function () {
        assert.strictEqual(callCount, 1);
        resolve();
      }, 500);
    }));
});

describe('ol.View.isNoopAnimation()', function () {
  const cases = [
    {
      animation: {
        sourceCenter: [0, 0],
        targetCenter: [0, 0],
        sourceResolution: 1,
        targetResolution: 1,
        sourceRotation: 0,
        targetRotation: 0,
      },
      noop: true,
    },
    {
      animation: {
        sourceCenter: [0, 0],
        targetCenter: [0, 1],
        sourceResolution: 1,
        targetResolution: 1,
        sourceRotation: 0,
        targetRotation: 0,
      },
      noop: false,
    },
    {
      animation: {
        sourceCenter: [0, 0],
        targetCenter: [0, 0],
        sourceResolution: 1,
        targetResolution: 0,
        sourceRotation: 0,
        targetRotation: 0,
      },
      noop: false,
    },
    {
      animation: {
        sourceCenter: [0, 0],
        targetCenter: [0, 0],
        sourceResolution: 1,
        targetResolution: 1,
        sourceRotation: 0,
        targetRotation: 1,
      },
      noop: false,
    },
    {
      animation: {
        sourceCenter: [0, 0],
        targetCenter: [0, 0],
      },
      noop: true,
    },
    {
      animation: {
        sourceCenter: [1, 0],
        targetCenter: [0, 0],
      },
      noop: false,
    },
    {
      animation: {
        sourceResolution: 1,
        targetResolution: 1,
      },
      noop: true,
    },
    {
      animation: {
        sourceResolution: 0,
        targetResolution: 1,
      },
      noop: false,
    },
    {
      animation: {
        sourceRotation: 10,
        targetRotation: 10,
      },
      noop: true,
    },
    {
      animation: {
        sourceRotation: 0,
        targetRotation: 10,
      },
      noop: false,
    },
  ];

  cases.forEach(function (c, i) {
    it('works for case ' + i, function () {
      const noop = isNoopAnimation(c.animation);
      assert.equal(noop, c.noop);
    });
  });
});
