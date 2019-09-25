import Map from '../../../src/ol/Map.js';
import View, {
  createCenterConstraint, createResolutionConstraint, createRotationConstraint,
  isNoopAnimation
} from '../../../src/ol/View.js';
import ViewHint from '../../../src/ol/ViewHint.js';
import {createEmpty} from '../../../src/ol/extent.js';
import Circle from '../../../src/ol/geom/Circle.js';
import LineString from '../../../src/ol/geom/LineString.js';
import Point from '../../../src/ol/geom/Point.js';

describe('ol.View', () => {

  describe('constructor (defaults)', () => {
    let view;

    beforeEach(() => {
      view = new View();
    });

    test('creates an instance', () => {
      expect(view).toBeInstanceOf(View);
    });

    test('provides default rotation', () => {
      expect(view.getRotation()).toBe(0);
    });

  });

  describe('parameter initialization with resolution/zoom constraints', () => {
    test('correctly handles max resolution constraint', () => {
      const view = new View({
        maxResolution: 1000,
        resolution: 1200
      });
      expect(view.getResolution()).toEqual(1000);
      expect(view.targetResolution_).toEqual(1000);
    });

    test('correctly handles min resolution constraint', () => {
      const view = new View({
        maxResolution: 1024,
        minResolution: 128,
        resolution: 50
      });
      expect(view.getResolution()).toEqual(128);
      expect(view.targetResolution_).toEqual(128);
    });

    test('correctly handles resolutions array constraint', () => {
      let view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32],
        resolution: 1200
      });
      expect(view.getResolution()).toEqual(1024);
      expect(view.targetResolution_).toEqual(1024);

      view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32],
        resolution: 10
      });
      expect(view.getResolution()).toEqual(32);
      expect(view.targetResolution_).toEqual(32);
    });

    test('correctly handles min zoom constraint', () => {
      const view = new View({
        minZoom: 3,
        zoom: 2
      });
      expect(view.getZoom()).toEqual(3);
      expect(view.targetResolution_).toEqual(view.getMaxResolution());
    });

    test('correctly handles max zoom constraint', () => {
      const view = new View({
        maxZoom: 4,
        zoom: 5
      });
      expect(view.getZoom()).toEqual(4);
      expect(view.targetResolution_).toEqual(view.getMaxResolution() / Math.pow(2, 4));
    });

    test('correctly handles extent constraint', () => {
      // default viewport size is 100x100
      const view = new View({
        extent: [0, 0, 50, 50],
        resolution: 1
      });
      expect(view.getResolution()).toEqual(0.5);
      expect(view.targetResolution_).toEqual(0.5);
    });
  });

  describe('create constraints', () => {

    describe('create center constraint', () => {

      describe('with no options', () => {
        test('gives a correct center constraint function', () => {
          const options = {};
          const size = [512, 256];
          const resolution = 1e5;
          const fn = createCenterConstraint(options);
          expect(fn([0, 0], resolution, size)).toEqual([0, 0]);
          expect(fn([42, -100], resolution, size)).toEqual([42, -100]);
        });
      });

      describe('panning off the edge of the world', () => {
        test('disallows going north off the world', () => {
          const options = {
            projection: 'EPSG:4326'
          };
          const size = [360, 180];
          const resolution = 0.5;
          const fn = createCenterConstraint(options);
          expect(fn([0, 0], resolution, size)).toEqual([0, 0]);
          expect(fn([0, 60], resolution, size)).toEqual([0, 45]);
          expect(fn([180, 60], resolution, size)).toEqual([180, 45]);
          expect(fn([-180, 60], resolution, size)).toEqual([-180, 45]);
        });

        test('disallows going south off the world', () => {
          const options = {
            projection: 'EPSG:4326'
          };
          const size = [360, 180];
          const resolution = 0.5;
          const fn = createCenterConstraint(options);
          expect(fn([0, 0], resolution, size)).toEqual([0, 0]);
          expect(fn([0, -60], resolution, size)).toEqual([0, -45]);
          expect(fn([180, -60], resolution, size)).toEqual([180, -45]);
          expect(fn([-180, -60], resolution, size)).toEqual([-180, -45]);
        });
      });

      describe('with multiWorld: true', () => {
        test('gives a correct center constraint function', () => {
          const options = {multiWorld: true};
          const size = [512, 256];
          const resolution = 1e5;
          const fn = createCenterConstraint(options);
          expect(fn([0, 0], resolution, size)).toEqual([0, 0]);
          expect(fn([42, -100], resolution, size)).toEqual([42, -100]);
        });
      });

      describe('with extent option and center only', () => {
        test('gives a correct center constraint function', () => {
          const options = {
            extent: [0, 0, 1, 1],
            constrainOnlyCenter: true
          };
          const fn = createCenterConstraint(options);
          expect(fn([0, 0])).toEqual([0, 0]);
          expect(fn([-10, 0])).toEqual([0, 0]);
          expect(fn([100, 100])).toEqual([1, 1]);
        });
      });

      describe('with extent option', () => {
        test('gives a correct center constraint function', () => {
          const options = {
            extent: [0, 0, 1, 1]
          };
          const fn = createCenterConstraint(options);
          const res = 1;
          const size = [0.15, 0.1];
          expect(fn([0, 0], res, size)).toEqual([0.075, 0.05]);
          expect(fn([0.5, 0.5], res, size)).toEqual([0.5, 0.5]);
          expect(fn([10, 10], res, size)).toEqual([0.925, 0.95]);

          const overshootCenter = fn([10, 10], res, size, true);
          expect(overshootCenter[0] > 0.925).toEqual(true);
          expect(overshootCenter[1] > 0.95).toEqual(true);
          expect(overshootCenter[0] < 9).toEqual(true);
          expect(overshootCenter[1] < 9).toEqual(true);
        });
      });

    });

    describe('create resolution constraint', () => {

      describe('with no options', () => {
        const size = [200, 200];
        test('gives a correct resolution constraint function', () => {
          const options = {};
          const fn = createResolutionConstraint(options).constraint;
          expect(fn(156543.03392804097, 0, size))
            .to.roughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0, size))
            .to.roughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, maxZoom, and zoomFactor options',
        () => {
          const size = [200, 200];
          test('gives a correct resolution constraint function', () => {
            const options = {
              maxResolution: 81,
              maxZoom: 3,
              zoomFactor: 3
            };
            const info = createResolutionConstraint(options);
            const maxResolution = info.maxResolution;
            expect(maxResolution).toEqual(81);
            const minResolution = info.minResolution;
            expect(minResolution).toEqual(3);
            const fn = info.constraint;
            expect(fn(82, 0, size)).toEqual(81);
            expect(fn(81, 0, size)).toEqual(81);
            expect(fn(27, 0, size)).toEqual(27);
            expect(fn(9, 0, size)).toEqual(9);
            expect(fn(3, 0, size)).toEqual(3);
            expect(fn(2, 0, size)).toEqual(3);
          });
        });

      describe('with resolutions', () => {
        const size = [200, 200];
        test('gives a correct resolution constraint function', () => {
          const options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          const info = createResolutionConstraint(options);
          const maxResolution = info.maxResolution;
          expect(maxResolution).toEqual(97);
          const minResolution = info.minResolution;
          expect(minResolution).toEqual(0.45);
          const fn = info.constraint;
          expect(fn(97, 0, size)).toEqual(97);
          expect(fn(76, 0, size)).toEqual(76);
          expect(fn(65, 0, size)).toEqual(65);
          expect(fn(54, 0, size)).toEqual(54);
          expect(fn(0.45, 0, size)).toEqual(0.45);
        });
      });

      describe('with zoom related options', () => {

        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        test('works with only maxZoom', () => {
          const maxZoom = 10;
          const constraint = getConstraint({
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          expect(constraint(0, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        test('works with only minZoom', () => {
          const minZoom = 5;
          const constraint = getConstraint({
            minZoom: minZoom
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, 28), 1e-9);
        });

        test('works with maxZoom and minZoom', () => {
          const minZoom = 2;
          const maxZoom = 11;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        test('works with maxZoom, minZoom, and zoomFactor', () => {
          const minZoom = 4;
          const maxZoom = 8;
          const zoomFactor = 3;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom,
            zoomFactor: zoomFactor
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(zoomFactor, minZoom), 1e-9);

          expect(constraint(0, 0, size)).to.roughlyEqual(
            defaultMaxRes / Math.pow(zoomFactor, maxZoom), 1e-9);
        });

      });

      describe('with resolution related options', () => {

        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        test('works with only maxResolution', () => {
          const maxResolution = 10e6;
          const constraint = getConstraint({
            multiWorld: true,
            maxResolution: maxResolution
          });

          expect(constraint(maxResolution * 3, 0, size)).to.roughlyEqual(
            maxResolution, 1e-9);

          const minResolution = constraint(0, 0, size);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).toBeGreaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).toBeLessThan(2);
        });

        test('works with only minResolution', () => {
          const minResolution = 100;
          const constraint = getConstraint({
            minResolution: minResolution
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          const constrainedMinRes = constraint(0, 0, size);
          expect(constrainedMinRes).toBeGreaterThan(minResolution);
          expect(constrainedMinRes / minResolution).toBeLessThan(2);
        });

        test('works with minResolution and maxResolution', () => {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 100,
            constrainResolution: true
          });

          expect(constraint(600, 0, size)).toBe(500);
          expect(constraint(500, 0, size)).toBe(500);
          expect(constraint(400, 0, size)).toBe(500);
          expect(constraint(300, 0, size)).toBe(250);
          expect(constraint(200, 0, size)).toBe(250);
          expect(constraint(100, 0, size)).toBe(125);
          expect(constraint(0, 0, size)).toBe(125);
        });

        test('accepts minResolution, maxResolution, and zoomFactor', () => {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 1,
            zoomFactor: 10,
            constrainResolution: true
          });

          expect(constraint(1000, 0, size)).toBe(500);
          expect(constraint(500, 0, size)).toBe(500);
          expect(constraint(100, 0, size)).toBe(50);
          expect(constraint(50, 0, size)).toBe(50);
          expect(constraint(10, 0, size)).toBe(5);
          expect(constraint(1, 0, size)).toBe(5);
        });

      });

      describe('overspecified options (prefers resolution)', () => {

        const defaultMaxRes = 156543.03392804097;
        const size = [200, 200];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        test('respects maxResolution over minZoom', () => {
          const maxResolution = 10e6;
          const minZoom = 8;
          const constraint = getConstraint({
            multiWorld: true,
            maxResolution: maxResolution,
            minZoom: minZoom
          });

          expect(constraint(maxResolution * 3, 0, size)).to.roughlyEqual(
            maxResolution, 1e-9);

          const minResolution = constraint(0, 0, size);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).toBeGreaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).toBeLessThan(2);
        });

        test('respects minResolution over maxZoom', () => {
          const minResolution = 100;
          const maxZoom = 50;
          const constraint = getConstraint({
            minResolution: minResolution,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, size)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          const constrainedMinRes = constraint(0, 0, size);
          expect(constrainedMinRes).toBeGreaterThan(minResolution);
          expect(constrainedMinRes / minResolution).toBeLessThan(2);
        });

      });

      describe('Map views that show more than one world', () => {

        const defaultMaxRes = 156543.03392804097;
        const size = [512, 512];
        const maxResolution = 160000;
        const resolutions = [160000, 80000, 40000, 20000, 10000, 5000];
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        test('are disabled by default', () => {
          const fn = getConstraint({});
          expect(fn(defaultMaxRes, 0, size)).toBe(defaultMaxRes / 2);
        });

        test('can be enabled by setting multiWorld to true', () => {
          const fn = getConstraint({
            multiWorld: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(defaultMaxRes);
        });

        test('disabled, with constrainResolution', () => {
          const fn = getConstraint({
            maxResolution: maxResolution,
            constrainResolution: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(defaultMaxRes / 2);
        });

        test('enabled, with constrainResolution', () => {
          const fn = getConstraint({
            maxResolution: maxResolution,
            constrainResolution: true,
            multiWorld: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(maxResolution);
        });

        test('disabled, with resolutions array', () => {
          const fn = getConstraint({
            resolutions: resolutions
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(defaultMaxRes / 2);
        });

        test('enabled, with resolutions array', () => {
          const fn = getConstraint({
            resolutions: resolutions,
            multiWorld: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(defaultMaxRes);
        });

        test('disabled, with resolutions array and constrainResolution', () => {
          const fn = getConstraint({
            resolutions: resolutions,
            constrainResolution: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(resolutions[2]);
        });

        test('enabled, with resolutions array and constrainResolution', () => {
          const fn = getConstraint({
            resolutions: resolutions,
            constrainResolution: true,
            multiWorld: true
          });
          expect(fn(defaultMaxRes, 0, size)).toBe(resolutions[0]);
        });
      });

    });

    describe('create rotation constraint', () => {
      test('gives a correct rotation constraint function', () => {
        const options = {};
        const fn = createRotationConstraint(options);
        expect(fn(0.01, 0)).toEqual(0);
        expect(fn(0.15, 0)).toEqual(0.15);
      });
    });

  });

  describe('#setHint()', () => {

    test('changes a view hint', () => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      expect(view.getHints()).toEqual([0, 0]);
      expect(view.getInteracting()).toEqual(false);

      view.setHint(ViewHint.INTERACTING, 1);
      expect(view.getHints()).toEqual([0, 1]);
      expect(view.getInteracting()).toEqual(true);
    });

    test('triggers the change event', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.on('change', function() {
        expect(view.getHints()).toEqual([0, 1]);
        expect(view.getInteracting()).toEqual(true);
        done();
      });
      view.setHint(ViewHint.INTERACTING, 1);
    });

  });

  describe('#getUpdatedOptions_()', () => {

    test('applies minZoom to constructor options', () => {
      const view = new View({
        center: [0, 0],
        minZoom: 2,
        zoom: 10
      });
      const options = view.getUpdatedOptions_({minZoom: 3});

      expect(options.center).toEqual([0, 0]);
      expect(options.minZoom).toEqual(3);
      expect(options.zoom).toEqual(10);
    });

    test('applies the current zoom', () => {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setZoom(8);
      const options = view.getUpdatedOptions_();

      expect(options.center).toEqual([0, 0]);
      expect(options.zoom).toEqual(8);
    });

    test(
      'applies the current resolution if resolution was originally supplied',
      () => {
        const view = new View({
          center: [0, 0],
          maxResolution: 2000,
          resolution: 1000
        });
        view.setResolution(500);
        const options = view.getUpdatedOptions_();

        expect(options.center).toEqual([0, 0]);
        expect(options.resolution).toEqual(500);
      }
    );

    test('applies the current center', () => {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setCenter([1, 2]);
      const options = view.getUpdatedOptions_();

      expect(options.center).toEqual([1, 2]);
      expect(options.zoom).toEqual(10);
    });

    test('applies the current rotation', () => {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setRotation(Math.PI / 6);
      const options = view.getUpdatedOptions_();

      expect(options.center).toEqual([0, 0]);
      expect(options.zoom).toEqual(10);
      expect(options.rotation).toEqual(Math.PI / 6);
    });

  });

  describe('#animate()', () => {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(() => {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(() => {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    test('can be called to animate view properties', done => {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 25
      }, function(complete) {
        expect(complete).toBe(true);
        expect(view.getCenter()).toEqual([0, 0]);
        expect(view.getZoom()).toEqual(4);
        expect(view.getAnimating()).toEqual(false);
        done();
      });
      expect(view.getAnimating()).toEqual(true);
    });

    test('allows duration to be zero', done => {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 0
      }, function(complete) {
        expect(complete).toBe(true);
        expect(view.getCenter()).toEqual([0, 0]);
        expect(view.getZoom()).toEqual(4);
        expect(view.getAnimating()).toEqual(false);
        done();
      });
    });

    test('immediately completes for no-op animations', () => {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 5,
        center: [0, 0],
        duration: 25
      });
      expect(view.getAnimating()).toEqual(false);
    });

    test('immediately completes if view is not defined before', () => {
      const view = new View();
      const center = [1, 2];
      const zoom = 3;
      const rotation = 0.4;

      view.animate({
        zoom: zoom,
        center: center,
        rotation: rotation,
        duration: 25
      });
      expect(view.getAnimating()).toEqual(false);
      expect(view.getCenter()).toEqual(center);
      expect(view.getZoom()).toEqual(zoom);
      expect(view.getRotation()).toEqual(rotation);
    });

    test('sets final animation state if view is not defined before', () => {
      const view = new View();

      const center = [1, 2];
      const zoom = 3;
      const rotation = 0.4;

      view.animate(
        {zoom: 1},
        {center: [2, 3]},
        {rotation: 4},
        {
          zoom: zoom,
          center: center,
          rotation: rotation,
          duration: 25
        }
      );
      expect(view.getAnimating()).toEqual(false);
      expect(view.getCenter()).toEqual(center);
      expect(view.getZoom()).toEqual(zoom);
      expect(view.getRotation()).toEqual(rotation);
    });

    test('prefers zoom over resolution', done => {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        resolution: view.getResolution() * 3,
        duration: 25
      }, function(complete) {
        expect(complete).toBe(true);
        expect(view.getZoom()).toBe(4);
        done();
      });
    });

    test('avoids going under minResolution', done => {
      const maxZoom = 14;
      const view = new View({
        center: [0, 0],
        zoom: 0,
        maxZoom: maxZoom
      });

      const minResolution = view.getMinResolution();
      view.animate({
        resolution: minResolution,
        duration: 10
      }, function(complete) {
        expect(complete).toBe(true);
        expect(view.getResolution()).toBe(minResolution);
        expect(view.getZoom()).toBe(maxZoom);
        done();
      });
    });

    test('takes the shortest arc to the target rotation', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 180 * 1
      });
      view.animate({
        rotation: Math.PI / 180 * 359,
        duration: 0
      }, function(complete) {
        expect(complete).toBe(true);
        expect(view.getRotation()).to.roughlyEqual(Math.PI / 180 * -1, 1e-12);
        done();
      });
    });

    test(
      'normalizes rotation to angles between -180 and 180 degrees after the anmiation',
      done => {
        const view = new View({
          center: [0, 0],
          zoom: 0,
          rotation: Math.PI / 180 * 1
        });
        view.animate({
          rotation: Math.PI / 180 * -181,
          duration: 0
        }, function(complete) {
          expect(complete).toBe(true);
          expect(view.getRotation()).to.roughlyEqual(Math.PI / 180 * 179, 1e-12);
          done();
        });
      }
    );

    test('calls a callback when animation completes', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 1,
        duration: 25
      }, function(complete) {
        expect(complete).toBe(true);
        done();
      });
    });

    test('allows the callback to trigger another animation', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      function firstCallback(complete) {
        expect(complete).toBe(true);

        view.animate({
          zoom: 2,
          duration: 10
        }, secondCallback);
      }

      function secondCallback(complete) {
        expect(complete).toBe(true);
        done();
      }

      view.animate({
        zoom: 1,
        duration: 25
      }, firstCallback);
    });

    test(
      'calls callback with false when animation is interrupted',
      done => {
        const view = new View({
          center: [0, 0],
          zoom: 0
        });

        view.animate({
          zoom: 1,
          duration: 25
        }, function(complete) {
          expect(complete).toBe(false);
          done();
        });

        view.setCenter([1, 2]); // interrupt the animation
      }
    );

    test('calls a callback even if animation is a no-op', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 0,
        duration: 25
      }, function(complete) {
        expect(complete).toBe(true);
        done();
      });
    });

    test('calls a callback if view is not defined before', done => {
      const view = new View();

      view.animate({
        zoom: 10,
        duration: 25
      }, function(complete) {
        expect(view.getZoom()).toBe(10);
        expect(complete).toBe(true);
        done();
      });
    });

    test('can run multiple animations in series', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      let checked = false;

      view.animate({
        zoom: 2,
        duration: 25
      }, {
        center: [10, 10],
        duration: 25
      }, function(complete) {
        expect(checked).toBe(true);
        expect(view.getZoom()).to.roughlyEqual(2, 1e-5);
        expect(view.getCenter()).toEqual([10, 10]);
        expect(complete).toBe(true);
        done();
      });

      setTimeout(function() {
        expect(view.getCenter()).toEqual([0, 0]);
        checked = true;
      }, 10);

    });

    test('properly sets the ANIMATING hint', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      let count = 3;
      function decrement() {
        --count;
        if (count === 0) {
          expect(view.getHints()[ViewHint.ANIMATING]).toBe(0);
          done();
        }
      }
      view.animate({
        center: [1, 2],
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(1);

      view.animate({
        zoom: 1,
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(2);

      view.animate({
        rotation: Math.PI,
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(3);

    });

    test('clears the ANIMATING hint when animations are cancelled', () => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      view.animate({
        center: [1, 2],
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(1);

      view.animate({
        zoom: 1,
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(2);

      view.animate({
        rotation: Math.PI,
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(3);

      // cancel animations
      view.setCenter([10, 20]);
      expect(view.getHints()[ViewHint.ANIMATING]).toBe(0);

    });

    test(
      'completes multiple staggered animations run in parallel',
      done => {

        const view = new View({
          center: [0, 0],
          zoom: 0
        });

        let calls = 0;

        view.animate({
          zoom: 1,
          duration: 25
        }, function() {
          ++calls;
        });

        setTimeout(function() {
          expect(view.getZoom() > 0).toBe(true);
          expect(view.getZoom() < 1).toBe(true);
          expect(view.getAnimating()).toBe(true);
          view.animate({
            zoom: 2,
            duration: 50
          }, function() {
            expect(calls).toBe(1);
            expect(view.getZoom()).toBe(2);
            expect(view.getAnimating()).toBe(false);
            done();
          });
        }, 10);

      }
    );

    test('completes complex animation using resolution', done => {

      const view = new View({
        center: [0, 0],
        resolution: 2
      });

      let calls = 0;

      function onAnimateEnd() {
        if (calls == 2) {
          expect(view.getAnimating()).toBe(false);
          done();
        }
      }

      view.animate({
        center: [100, 100],
        duration: 50
      }, function() {
        ++calls;
        expect(view.getCenter()).toEqual([100, 100]);
        onAnimateEnd();
      });

      view.animate({
        resolution: 2000,
        duration: 25
      }, {
        resolution: 2,
        duration: 25
      }, function() {
        ++calls;
        expect(view.getResolution()).toBe(2);
        onAnimateEnd();
      });

      setTimeout(function() {
        expect(view.getResolution() > 2).toBe(true);
        expect(view.getResolution() < 2000).toBe(true);
        expect(view.getAnimating()).toBe(true);
      }, 10);

      setTimeout(function() {
        expect(view.getResolution() > 2).toBe(true);
        expect(view.getResolution() < 2000).toBe(true);
        expect(view.getAnimating()).toBe(true);
      }, 40);

    });

  });

  describe('#cancelAnimations()', () => {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(() => {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(() => {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    test('cancels a currently running animation', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      view.animate({
        rotation: 10,
        duration: 50
      });

      setTimeout(function() {
        expect(view.getAnimating()).toBe(true);
        view.once('change', function() {
          expect(view.getAnimating()).toBe(false);
          done();
        });
        view.cancelAnimations();
      }, 10);
    });

    test('cancels a multiple animations', done => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      view.animate({
        rotation: 10,
        duration: 50
      }, {
        zoom: 10,
        duration: 50
      });

      view.animate({
        center: [10, 30],
        duration: 100
      });

      setTimeout(function() {
        expect(view.getAnimating()).toBe(true);
        view.once('change', function() {
          expect(view.getAnimating()).toBe(false);
          done();
        });
        view.cancelAnimations();
      }, 10);
    });

    test(
      'calls callbacks with false to indicate animations did not complete',
      done => {
        const view = new View({
          center: [0, 0],
          zoom: 0
        });

        view.animate({
          zoom: 10,
          duration: 50
        }, function(complete) {
          expect(view.getAnimating()).toBe(false);
          expect(complete).toBe(false);
          done();
        });

        setTimeout(function() {
          expect(view.getAnimating()).toBe(true);
          view.cancelAnimations();
        }, 10);
      }
    );

  });

  describe('#getResolutions', () => {
    let view;
    const resolutions = [512, 256, 128, 64, 32, 16];

    test('returns correct resolutions', () => {
      view = new View({
        resolutions: resolutions
      });
      expect(view.getResolutions()).toBe(resolutions);
    });

    test('returns resolutions as undefined', () => {
      view = new View();
      expect(view.getResolutions()).toBe(undefined);
    });
  });

  describe('#getZoom', () => {
    let view;
    beforeEach(() => {
      view = new View({
        resolutions: [1024, 512, 256, 128, 64, 32, 16, 8]
      });
    });

    test('returns correct zoom levels (with resolutions array)', () => {
      view.setResolution(undefined);
      expect(view.getZoom()).toBe(undefined);

      view.setResolution(513);
      expect(view.getZoom()).to.roughlyEqual(Math.log(1024 / 513) / Math.LN2, 1e-9);

      view.setResolution(512);
      expect(view.getZoom()).toBe(1);

      view.setResolution(100);
      expect(view.getZoom()).to.roughlyEqual(3.35614, 1e-5);

      view.setResolution(65);
      expect(view.getZoom()).to.roughlyEqual(3.97763, 1e-5);

      view.setResolution(64);
      expect(view.getZoom()).toBe(4);

      view.setResolution(16);
      expect(view.getZoom()).toBe(6);

      view.setResolution(15);
      expect(view.getZoom()).to.roughlyEqual(Math.log(1024 / 15) / Math.LN2, 1e-9);
    });

    test('works for resolution arrays with variable zoom factors', () => {
      const view = new View({
        resolutions: [10, 5, 2, 1]
      });

      view.setZoom(1);
      expect(view.getZoom()).toBe(1);

      view.setZoom(1.3);
      expect(view.getZoom()).toBe(1.3);

      view.setZoom(2);
      expect(view.getZoom()).toBe(2);

      view.setZoom(2.7);
      expect(view.getZoom()).toBe(2.7);

      view.setZoom(3);
      expect(view.getZoom()).toBe(3);

    });
  });

  describe('#getZoom() - constrained', () => {
    test('returns correct zoom levels', () => {
      const view = new View({
        minZoom: 10,
        maxZoom: 20
      });

      view.setZoom(5);
      expect(view.getZoom()).toBe(10);

      view.setZoom(10);
      expect(view.getZoom()).toBe(10);

      view.setZoom(15);
      expect(view.getZoom()).toBe(15);

      view.setZoom(15.3);
      expect(view.getZoom()).toBe(15.3);

      view.setZoom(20);
      expect(view.getZoom()).toBe(20);

      view.setZoom(25);
      expect(view.getZoom()).toBe(20);
    });
  });

  describe('#getZoom() - overspecified', () => {

    test('gives maxResolution precedence over minZoom', () => {

      const view = new View({
        maxResolution: 100,
        minZoom: 2 // this should get ignored
      });

      view.setResolution(100);
      expect(view.getZoom()).toBe(0);

      view.setZoom(0);
      expect(view.getResolution()).toBe(100);
    });
  });

  describe('#getZoomForResolution', () => {

    test('returns correct zoom levels', () => {
      const view = new View();
      const max = view.getMaxResolution();

      expect(view.getZoomForResolution(max)).toBe(0);

      expect(view.getZoomForResolution(max / 2)).toBe(1);

      expect(view.getZoomForResolution(max / 4)).toBe(2);

      expect(view.getZoomForResolution(2 * max)).toBe(-1);
    });

    test(
      'returns correct zoom levels for specifically configured resolutions',
      () => {
        const view = new View({
          resolutions: [10, 8, 6, 4, 2]
        });

        expect(view.getZoomForResolution(10)).toBe(0);

        expect(view.getZoomForResolution(8)).toBe(1);

        expect(view.getZoomForResolution(6)).toBe(2);

        expect(view.getZoomForResolution(4)).toBe(3);

        expect(view.getZoomForResolution(2)).toBe(4);
      }
    );

  });

  describe('#getResolutionForZoom', () => {

    test('returns correct zoom resolution', () => {
      const view = new View();
      const max = view.getMaxZoom();
      const min = view.getMinZoom();

      expect(view.getResolutionForZoom(max)).toBe(view.getMinResolution());
      expect(view.getResolutionForZoom(max + 1)).toBe(view.getMinResolution() / 2);
      expect(view.getResolutionForZoom(min)).toBe(view.getMaxResolution());
      expect(view.getResolutionForZoom(min - 1)).toBe(view.getMaxResolution() * 2);
    });

    test(
      'returns correct zoom levels for specifically configured resolutions',
      () => {
        const view = new View({
          resolutions: [10, 8, 6, 4, 2]
        });

        expect(view.getResolutionForZoom(-1)).toBe(10);
        expect(view.getResolutionForZoom(0)).toBe(10);
        expect(view.getResolutionForZoom(1)).toBe(8);
        expect(view.getResolutionForZoom(2)).toBe(6);
        expect(view.getResolutionForZoom(3)).toBe(4);
        expect(view.getResolutionForZoom(4)).toBe(2);
        expect(view.getResolutionForZoom(5)).toBe(2);
      }
    );

    test(
      'returns correct zoom levels for resolutions with variable zoom levels',
      () => {
        const view = new View({
          resolutions: [50, 10, 5, 2.5, 1.25, 0.625]
        });

        expect(view.getResolutionForZoom(-1)).toBe(50);
        expect(view.getResolutionForZoom(0)).toBe(50);
        expect(view.getResolutionForZoom(0.5)).toBe(50 / Math.pow(5, 0.5));
        expect(view.getResolutionForZoom(1)).toBe(10);
        expect(view.getResolutionForZoom(2)).toBe(5);
        expect(view.getResolutionForZoom(2.75)).toBe(5 / Math.pow(2, 0.75));
        expect(view.getResolutionForZoom(3)).toBe(2.5);
        expect(view.getResolutionForZoom(4)).toBe(1.25);
        expect(view.getResolutionForZoom(5)).toBe(0.625);
        expect(view.getResolutionForZoom(6)).toBe(0.625);
      }
    );

  });

  describe('#getMaxZoom', () => {

    test('returns the zoom level for the min resolution', () => {
      const view = new View();
      expect(view.getMaxZoom()).toBe(view.getZoomForResolution(view.getMinResolution()));
    });

    test('works for a view configured with a maxZoom', () => {
      const view = new View({
        maxZoom: 10
      });
      expect(view.getMaxZoom()).toBe(10);
    });

  });

  describe('#getMinZoom', () => {

    test('returns the zoom level for the max resolution', () => {
      const view = new View();
      expect(view.getMinZoom()).toBe(view.getZoomForResolution(view.getMaxResolution()));
    });

    test('works for views configured with a minZoom', () => {
      const view = new View({
        minZoom: 3
      });
      expect(view.getMinZoom()).toBe(3);
    });

  });

  describe('#setMaxZoom', () => {
    describe('with resolutions property in view', () => {
      test('changes the zoom level when the level is over max zoom', () => {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4
        });

        view.setMaxZoom(2);
        expect(view.getZoom()).toBe(2);
      });
    });

    describe('with no resolutions property in view', () => {
      test('changes the zoom level when the level is over max zoom', () => {
        const view = new View({
          zoom: 4
        });

        view.setMaxZoom(2);
        expect(view.getZoom()).toBe(2);
      });
    });
  });

  describe('#setMinZoom', () => {
    describe('with resolutions property in view', () => {
      test('changes the zoom level when the level is under min zoom', () => {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4
        });

        view.setMinZoom(5);
        expect(view.getZoom()).toBe(5);
      });
    });

    describe('with no resolutions property in view', () => {
      test('changes the zoom level when the level is under min zoom', () => {
        const view = new View({
          zoom: 4
        });

        view.setMinZoom(5);
        expect(view.getZoom()).toBe(5);
      });
    });
  });

  describe('#calculateExtent', () => {
    test('returns the expected extent', () => {
      const view = new View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0]
      });

      const extent = view.calculateExtent([100, 200]);
      expect(extent[0]).toBe(-25600);
      expect(extent[1]).toBe(-51200);
      expect(extent[2]).toBe(25600);
      expect(extent[3]).toBe(51200);
    });
    test('returns the expected extent with rotation', () => {
      const view = new View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0],
        rotation: Math.PI / 2
      });
      const extent = view.calculateExtent([100, 200]);
      expect(extent[0]).to.roughlyEqual(-51200, 1e-9);
      expect(extent[1]).to.roughlyEqual(-25600, 1e-9);
      expect(extent[2]).to.roughlyEqual(51200, 1e-9);
      expect(extent[3]).to.roughlyEqual(25600, 1e-9);
    });
  });

  describe('#getSizeFromViewport_()', () => {
    let map, target;
    beforeEach(() => {
      target = document.createElement('div');
      target.style.width = '200px';
      target.style.height = '150px';
      map = new Map({
        target: target
      });
      document.body.appendChild(target);
    });
    afterEach(() => {
      map.setTarget(null);
      document.body.removeChild(target);
    });
    test('calculates the size correctly', () => {
      let size = map.getView().getSizeFromViewport_();
      expect(size).toEqual([200, 150]);
      size = map.getView().getSizeFromViewport_(Math.PI / 2);
      expect(size[0]).to.roughlyEqual(150, 1e-9);
      expect(size[1]).to.roughlyEqual(200, 1e-9);
      size = map.getView().getSizeFromViewport_(Math.PI);
      expect(size[0]).to.roughlyEqual(200, 1e-9);
      expect(size[1]).to.roughlyEqual(150, 1e-9);
    });
  });

  describe('fit', () => {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(() => {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(() => {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    let view;
    beforeEach(() => {
      view = new View({
        center: [0, 0],
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1],
        zoom: 5
      });
    });
    test(
      'fits correctly to the geometry (with unconstrained resolution)',
      () => {
        view.fit(
          new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          {size: [200, 200], padding: [100, 0, 0, 100]});
        expect(view.getResolution()).toBe(11);
        expect(view.getCenter()[0]).toBe(5950);
        expect(view.getCenter()[1]).toBe(47100);

        view.fit(
          new Circle([6000, 46000], 1000),
          {size: [200, 200]});
        expect(view.getResolution()).toBe(10);
        expect(view.getCenter()[0]).toBe(6000);
        expect(view.getCenter()[1]).toBe(46000);

        view.setRotation(Math.PI / 8);
        view.fit(
          new Circle([6000, 46000], 1000),
          {size: [200, 200]});
        expect(view.getResolution()).to.roughlyEqual(10, 1e-9);
        expect(view.getCenter()[0]).to.roughlyEqual(6000, 1e-9);
        expect(view.getCenter()[1]).to.roughlyEqual(46000, 1e-9);

        view.setRotation(Math.PI / 4);
        view.fit(
          new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          {size: [200, 200], padding: [100, 0, 0, 100]});
        expect(view.getResolution()).to.roughlyEqual(14.849242404917458, 1e-9);
        expect(view.getCenter()[0]).to.roughlyEqual(5200, 1e-9);
        expect(view.getCenter()[1]).to.roughlyEqual(46300, 1e-9);
      }
    );
    test('fits correctly to the geometry', () => {
      view.setConstrainResolution(true);

      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100]});
      expect(view.getResolution()).toBe(20);
      expect(view.getCenter()[0]).toBe(5500);
      expect(view.getCenter()[1]).toBe(47550);

      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100], nearest: true});
      expect(view.getResolution()).toBe(10);
      expect(view.getCenter()[0]).toBe(6000);
      expect(view.getCenter()[1]).toBe(47050);

      view.fit(
        new Point([6000, 46000]),
        {size: [200, 200], padding: [100, 0, 0, 100], minResolution: 2});
      expect(view.getResolution()).toBe(2);
      expect(view.getCenter()[0]).toBe(5900);
      expect(view.getCenter()[1]).toBe(46100);

      view.fit(
        new Point([6000, 46000]),
        {size: [200, 200], padding: [100, 0, 0, 100], maxZoom: 6});
      expect(view.getResolution()).toBe(2);
      expect(view.getZoom()).toBe(6);
      expect(view.getCenter()[0]).toBe(5900);
      expect(view.getCenter()[1]).toBe(46100);
    });

    test('fits correctly to the extent', () => {
      view.fit([1000, 1000, 2000, 2000], {size: [200, 200]});
      expect(view.getResolution()).toBe(5);
      expect(view.getCenter()[0]).toBe(1500);
      expect(view.getCenter()[1]).toBe(1500);
    });
    test('throws on invalid geometry/extent value', () => {
      expect(function() {
        view.fit(true, [200, 200]);
      }).toThrow();
    });
    test('throws on empty extent', () => {
      expect(function() {
        view.fit(createEmpty());
      }).toThrow();
    });
    test('animates when duration is defined', done => {
      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {
          size: [200, 200],
          padding: [100, 0, 0, 100],
          duration: 25
        });

      expect(view.getAnimating()).toEqual(true);

      setTimeout(function() {
        expect(view.getResolution()).toBe(11);
        expect(view.getCenter()[0]).toBe(5950);
        expect(view.getCenter()[1]).toBe(47100);
        expect(view.getAnimating()).toEqual(false);
        done();
      }, 50);

    });
    test('calls a callback when duration is not defined', done => {
      view.fit(new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        callback: function(complete) {
          expect(complete).toBe(true);
          done();
        }
      });
    });
    test('calls a callback when animation completes', done => {
      view.fit(new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        duration: 25,
        callback: function(complete) {
          expect(complete).toBe(true);
          done();
        }
      });
    });

  });

  describe('centerOn', () => {
    let view;
    beforeEach(() => {
      view = new View({
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1]
      });
    });
    test('fit correctly to the coordinates', () => {
      view.setResolution(10);
      view.centerOn(
        [6000, 46000],
        [400, 400],
        [300, 300]
      );
      expect(view.getCenter()[0]).toBe(5000);
      expect(view.getCenter()[1]).toBe(47000);

      view.setRotation(Math.PI / 4);
      view.centerOn(
        [6000, 46000],
        [400, 400],
        [300, 300]
      );
      expect(view.getCenter()[0]).to.roughlyEqual(4585.78643762691, 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(46000, 1e-9);
    });
  });

  describe('#beginInteraction() and endInteraction()', () => {
    let view;
    beforeEach(() => {
      view = new View();
    });

    test('correctly changes the view hint', () => {
      view.beginInteraction();
      expect(view.getHints()[1]).toBe(1);
      view.beginInteraction();
      expect(view.getHints()[1]).toBe(2);
      view.endInteraction();
      view.endInteraction();
      expect(view.getHints()[1]).toBe(0);
    });
  });

  describe('#getConstrainedZoom()', () => {
    let view;

    test('works correctly without constraint', () => {
      view = new View({
        zoom: 0
      });
      expect(view.getConstrainedZoom(3)).toBe(3);
    });
    test('works correctly with resolution constraints', () => {
      view = new View({
        zoom: 4,
        minZoom: 4,
        maxZoom: 8
      });
      expect(view.getConstrainedZoom(3)).toBe(4);
      expect(view.getConstrainedZoom(10)).toBe(8);
    });
    test('works correctly with a specific resolution set', () => {
      view = new View({
        zoom: 0,
        resolutions: [512, 256, 128, 64, 32, 16, 8]
      });
      expect(view.getConstrainedZoom(0)).toBe(0);
      expect(view.getConstrainedZoom(4)).toBe(4);
      expect(view.getConstrainedZoom(8)).toBe(6);
    });
  });

  describe('#getConstrainedResolution()', () => {
    let view;
    const defaultMaxRes = 156543.03392804097;

    test('works correctly by snapping to power of 2', () => {
      view = new View();
      expect(view.getConstrainedResolution(1000000)).toBe(defaultMaxRes);
      expect(view.getConstrainedResolution(defaultMaxRes / 8)).toBe(defaultMaxRes / 8);
    });
    test('works correctly by snapping to a custom zoom factor', () => {
      view = new View({
        maxResolution: 2500,
        zoomFactor: 5,
        maxZoom: 4,
        constrainResolution: true
      });
      expect(view.getConstrainedResolution(90, 1)).toBe(100);
      expect(view.getConstrainedResolution(90, -1)).toBe(20);
      expect(view.getConstrainedResolution(20)).toBe(20);
      expect(view.getConstrainedResolution(5)).toBe(4);
      expect(view.getConstrainedResolution(1)).toBe(4);
    });
    test('works correctly with a specific resolution set', () => {
      view = new View({
        zoom: 0,
        resolutions: [512, 256, 128, 64, 32, 16, 8],
        constrainResolution: true
      });
      expect(view.getConstrainedResolution(1000, 1)).toBe(512);
      expect(view.getConstrainedResolution(260, 1)).toBe(512);
      expect(view.getConstrainedResolution(260)).toBe(256);
      expect(view.getConstrainedResolution(30)).toBe(32);
      expect(view.getConstrainedResolution(30, -1)).toBe(16);
      expect(view.getConstrainedResolution(4, -1)).toBe(8);
    });
  });

  describe('#adjustRotation()', () => {
    test('changes view rotation with anchor', () => {
      const view = new View({
        resolution: 1,
        center: [0, 0]
      });

      view.adjustRotation(Math.PI / 2);
      expect(view.getRotation()).toBe(Math.PI / 2);
      expect(view.getCenter()).toEqual([0, 0]);

      view.adjustRotation(-Math.PI);
      expect(view.getRotation()).toBe(-Math.PI / 2);
      expect(view.getCenter()).toEqual([0, 0]);

      view.adjustRotation(Math.PI / 3, [50, 0]);
      expect(view.getRotation()).to.roughlyEqual(-Math.PI / 6, 1e-9);
      expect(view.getCenter()[0]).to.roughlyEqual(50 * (1 - Math.cos(Math.PI / 3)), 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(-50 * Math.sin(Math.PI / 3), 1e-9);
    });

    test('does not change view parameters if rotation is disabled', () => {
      const view = new View({
        resolution: 1,
        enableRotation: false,
        center: [0, 0]
      });

      view.adjustRotation(Math.PI / 2);
      expect(view.getRotation()).toBe(0);
      expect(view.getCenter()).toEqual([0, 0]);

      view.adjustRotation(-Math.PI * 3, [-50, 0]);
      expect(view.getRotation()).toBe(0);
      expect(view.getCenter()).toEqual([0, 0]);
    });
  });

  describe('#adjustZoom()', () => {

    test('changes view resolution', () => {
      const view = new View({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      view.adjustZoom(1);
      expect(view.getResolution()).toBe(0.5);

      view.adjustZoom(-1);
      expect(view.getResolution()).toBe(1);

      view.adjustZoom(2);
      expect(view.getResolution()).toBe(0.25);

      view.adjustZoom(-2);
      expect(view.getResolution()).toBe(1);
    });

    test('changes view resolution and center relative to the anchor', () => {
      const view = new View({
        center: [0, 0],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      view.adjustZoom(1, [10, 10]);
      expect(view.getCenter()).toEqual([5, 5]);

      view.adjustZoom(-1, [0, 0]);
      expect(view.getCenter()).toEqual([10, 10]);

      view.adjustZoom(2, [0, 0]);
      expect(view.getCenter()).toEqual([2.5, 2.5]);

      view.adjustZoom(-2, [0, 0]);
      expect(view.getCenter()).toEqual([10, 10]);
    });

    test(
      'changes view resolution and center relative to the anchor, while respecting the extent (center only)',
      () => {
        const view = new View({
          center: [0, 0],
          extent: [-2.5, -2.5, 2.5, 2.5],
          constrainOnlyCenter: true,
          resolution: 1,
          resolutions: [4, 2, 1, 0.5, 0.25]
        });

        view.adjustZoom(1, [10, 10]);
        expect(view.getCenter()).toEqual([2.5, 2.5]);

        view.adjustZoom(-1, [0, 0]);
        expect(view.getCenter()).toEqual([2.5, 2.5]);

        view.adjustZoom(2, [10, 10]);
        expect(view.getCenter()).toEqual([2.5, 2.5]);

        view.adjustZoom(-2, [0, 0]);
        expect(view.getCenter()).toEqual([2.5, 2.5]);
      }
    );

    test(
      'changes view resolution and center relative to the anchor, while respecting the extent',
      () => {
        const map = new Map({});
        const view = new View({
          center: [50, 50],
          extent: [0, 0, 100, 100],
          resolution: 1,
          resolutions: [4, 2, 1, 0.5, 0.25, 0.125]
        });
        map.setView(view);

        view.adjustZoom(1, [100, 100]);
        expect(view.getCenter()).toEqual([75, 75]);

        view.adjustZoom(-1, [75, 75]);
        expect(view.getCenter()).toEqual([50, 50]);

        view.adjustZoom(2, [100, 100]);
        expect(view.getCenter()).toEqual([87.5, 87.5]);

        view.adjustZoom(-3, [0, 0]);
        expect(view.getCenter()).toEqual([50, 50]);
        expect(view.getResolution()).toEqual(1);
      }
    );

    test(
      'changes view resolution and center relative to the anchor, while respecting the extent (rotated)',
      () => {
        const map = new Map({});
        const view = new View({
          center: [50, 50],
          extent: [-100, -100, 100, 100],
          resolution: 1,
          resolutions: [2, 1, 0.5, 0.25, 0.125],
          rotation: Math.PI / 4
        });
        map.setView(view);
        const halfSize = 100 * Math.SQRT1_2;

        view.adjustZoom(1, [100, 100]);
        expect(view.getCenter()).toEqual([100 - halfSize / 2, 100 - halfSize / 2]);

        view.setCenter([0, 50]);
        view.adjustZoom(-1, [0, 0]);
        expect(view.getCenter()).toEqual([0, 100 - halfSize]);
      }
    );
  });
});

describe('does not start unexpected animations during interaction', () => {
  let map;
  beforeEach(() => {
    map = new Map({
      target: createMapDiv(512, 256)
    });
  });
  afterEach(() => {
    disposeMap(map);
  });

  test(
    'works when initialized with #setCenter() and #setZoom()',
    done => {
      const view = map.getView();
      let callCount = 0;
      view.on('change:resolution', function() {
        ++callCount;
      });
      view.setCenter([0, 0]);
      view.setZoom(0);
      view.beginInteraction();
      view.endInteraction();
      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 500);
    }
  );

  test('works when initialized with #animate()', done => {
    const view = map.getView();
    let callCount = 0;
    view.on('change:resolution', function() {
      ++callCount;
    });
    view.animate({
      center: [0, 0],
      zoom: 0
    });
    view.beginInteraction();
    view.endInteraction();
    setTimeout(function() {
      expect(callCount).toBe(1);
      done();
    }, 500);
  });
});

describe('ol.View.isNoopAnimation()', () => {

  const cases = [{
    animation: {
      sourceCenter: [0, 0], targetCenter: [0, 0],
      sourceResolution: 1, targetResolution: 1,
      sourceRotation: 0, targetRotation: 0
    },
    noop: true
  }, {
    animation: {
      sourceCenter: [0, 0], targetCenter: [0, 1],
      sourceResolution: 1, targetResolution: 1,
      sourceRotation: 0, targetRotation: 0
    },
    noop: false
  }, {
    animation: {
      sourceCenter: [0, 0], targetCenter: [0, 0],
      sourceResolution: 1, targetResolution: 0,
      sourceRotation: 0, targetRotation: 0
    },
    noop: false
  }, {
    animation: {
      sourceCenter: [0, 0], targetCenter: [0, 0],
      sourceResolution: 1, targetResolution: 1,
      sourceRotation: 0, targetRotation: 1
    },
    noop: false
  }, {
    animation: {
      sourceCenter: [0, 0], targetCenter: [0, 0]
    },
    noop: true
  }, {
    animation: {
      sourceCenter: [1, 0], targetCenter: [0, 0]
    },
    noop: false
  }, {
    animation: {
      sourceResolution: 1, targetResolution: 1
    },
    noop: true
  }, {
    animation: {
      sourceResolution: 0, targetResolution: 1
    },
    noop: false
  }, {
    animation: {
      sourceRotation: 10, targetRotation: 10
    },
    noop: true
  }, {
    animation: {
      sourceRotation: 0, targetRotation: 10
    },
    noop: false
  }];

  cases.forEach(function(c, i) {
    test('works for case ' + i, () => {
      const noop = isNoopAnimation(c.animation);
      expect(noop).toBe(c.noop);
    });
  });
});
