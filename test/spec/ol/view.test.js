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

describe('ol.View', function() {

  describe('constructor (defaults)', function() {
    let view;

    beforeEach(function() {
      view = new View();
    });

    it('creates an instance', function() {
      expect(view).to.be.a(View);
    });

    it('provides default rotation', function() {
      expect(view.getRotation()).to.be(0);
    });

  });

  describe('create constraints', function() {

    describe('create center constraint', function() {

      describe('with no options', function() {
        it('gives a correct center constraint function', function() {
          const options = {};
          const fn = createCenterConstraint(options);
          expect(fn([0, 0])).to.eql([0, 0]);
          expect(fn(undefined)).to.eql(undefined);
          expect(fn([42, -100])).to.eql([42, -100]);
        });
      });

      describe('with extent option', function() {
        it('gives a correct center constraint function', function() {
          const options = {
            extent: [0, 0, 1, 1]
          };
          const fn = createCenterConstraint(options);
          expect(fn([0, 0])).to.eql([0, 0]);
          expect(fn([-10, 0])).to.eql([0, 0]);
          expect(fn([100, 100])).to.eql([1, 1]);
        });
      });

    });

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          const options = {};
          const fn = createResolutionConstraint(options).constraint;
          expect(fn(156543.03392804097, 0, 0))
            .to.roughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0, 0))
            .to.roughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, maxZoom, and zoomFactor options',
        function() {
          it('gives a correct resolution constraint function', function() {
            const options = {
              maxResolution: 81,
              maxZoom: 3,
              zoomFactor: 3
            };
            const info = createResolutionConstraint(options);
            const maxResolution = info.maxResolution;
            expect(maxResolution).to.eql(81);
            const minResolution = info.minResolution;
            expect(minResolution).to.eql(3);
            const fn = info.constraint;
            expect(fn(82, 0, 0)).to.eql(81);
            expect(fn(81, 0, 0)).to.eql(81);
            expect(fn(27, 0, 0)).to.eql(27);
            expect(fn(9, 0, 0)).to.eql(9);
            expect(fn(3, 0, 0)).to.eql(3);
            expect(fn(2, 0, 0)).to.eql(3);
          });
        });

      describe('with resolutions', function() {
        it('gives a correct resolution constraint function', function() {
          const options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          const info = createResolutionConstraint(options);
          const maxResolution = info.maxResolution;
          expect(maxResolution).to.eql(97);
          const minResolution = info.minResolution;
          expect(minResolution).to.eql(0.45);
          const fn = info.constraint;
          expect(fn(97, 0, 0)).to.eql(97);
          expect(fn(76, 0, 0)).to.eql(76);
          expect(fn(65, 0, 0)).to.eql(65);
          expect(fn(54, 0, 0)).to.eql(54);
          expect(fn(0.45, 0, 0)).to.eql(0.45);
        });
      });

      describe('with zoom related options', function() {

        const defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('works with only maxZoom', function() {
          const maxZoom = 10;
          const constraint = getConstraint({
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        it('works with only minZoom', function() {
          const minZoom = 5;
          const constraint = getConstraint({
            minZoom: minZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, 28), 1e-9);
        });

        it('works with maxZoom and minZoom', function() {
          const minZoom = 2;
          const maxZoom = 11;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        it('works with maxZoom, minZoom, and zoomFactor', function() {
          const minZoom = 4;
          const maxZoom = 8;
          const zoomFactor = 3;
          const constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom,
            zoomFactor: zoomFactor
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(zoomFactor, minZoom), 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
            defaultMaxRes / Math.pow(zoomFactor, maxZoom), 1e-9);
        });

      });

      describe('with resolution related options', function() {

        const defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('works with only maxResolution', function() {
          const maxResolution = 10e6;
          const constraint = getConstraint({
            maxResolution: maxResolution
          });

          expect(constraint(maxResolution * 3, 0, 0)).to.roughlyEqual(
            maxResolution, 1e-9);

          const minResolution = constraint(0, 0, 0);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).to.be.greaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).to.be.lessThan(2);
        });

        it('works with only minResolution', function() {
          const minResolution = 100;
          const constraint = getConstraint({
            minResolution: minResolution
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          const constrainedMinRes = constraint(0, 0, 0);
          expect(constrainedMinRes).to.be.greaterThan(minResolution);
          expect(constrainedMinRes / minResolution).to.be.lessThan(2);
        });

        it('works with minResolution and maxResolution', function() {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 100
          });

          expect(constraint(600, 0, 0)).to.be(500);
          expect(constraint(500, 0, 0)).to.be(500);
          expect(constraint(400, 0, 0)).to.be(500);
          expect(constraint(300, 0, 0)).to.be(250);
          expect(constraint(200, 0, 0)).to.be(250);
          expect(constraint(100, 0, 0)).to.be(125);
          expect(constraint(0, 0, 0)).to.be(125);
        });

        it('accepts minResolution, maxResolution, and zoomFactor', function() {
          const constraint = getConstraint({
            maxResolution: 500,
            minResolution: 1,
            zoomFactor: 10
          });

          expect(constraint(1000, 0, 0)).to.be(500);
          expect(constraint(500, 0, 0)).to.be(500);
          expect(constraint(100, 0, 0)).to.be(50);
          expect(constraint(50, 0, 0)).to.be(50);
          expect(constraint(10, 0, 0)).to.be(5);
          expect(constraint(1, 0, 0)).to.be(5);
        });

      });

      describe('overspecified options (prefers resolution)', function() {

        const defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return createResolutionConstraint(options).constraint;
        }

        it('respects maxResolution over minZoom', function() {
          const maxResolution = 10e6;
          const minZoom = 8;
          const constraint = getConstraint({
            maxResolution: maxResolution,
            minZoom: minZoom
          });

          expect(constraint(maxResolution * 3, 0, 0)).to.roughlyEqual(
            maxResolution, 1e-9);

          const minResolution = constraint(0, 0, 0);
          const defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).to.be.greaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).to.be.lessThan(2);
        });

        it('respects minResolution over maxZoom', function() {
          const minResolution = 100;
          const maxZoom = 50;
          const constraint = getConstraint({
            minResolution: minResolution,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
            defaultMaxRes, 1e-9);

          const constrainedMinRes = constraint(0, 0, 0);
          expect(constrainedMinRes).to.be.greaterThan(minResolution);
          expect(constrainedMinRes / minResolution).to.be.lessThan(2);
        });

      });

    });

    describe('create rotation constraint', function() {
      it('gives a correct rotation constraint function', function() {
        const options = {};
        const fn = createRotationConstraint(options);
        expect(fn(0.01, 0)).to.eql(0);
        expect(fn(0.15, 0)).to.eql(0.15);
      });
    });

  });

  describe('#setHint()', function() {

    it('changes a view hint', function() {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      expect(view.getHints()).to.eql([0, 0]);
      expect(view.getInteracting()).to.eql(false);

      view.setHint(ViewHint.INTERACTING, 1);
      expect(view.getHints()).to.eql([0, 1]);
      expect(view.getInteracting()).to.eql(true);
    });

    it('triggers the change event', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.on('change', function() {
        expect(view.getHints()).to.eql([0, 1]);
        expect(view.getInteracting()).to.eql(true);
        done();
      });
      view.setHint(ViewHint.INTERACTING, 1);
    });

  });

  describe('#getUpdatedOptions_()', function() {

    it('applies minZoom to constructor options', function() {
      const view = new View({
        center: [0, 0],
        minZoom: 2,
        zoom: 10
      });
      const options = view.getUpdatedOptions_({minZoom: 3});

      expect(options.center).to.eql([0, 0]);
      expect(options.minZoom).to.eql(3);
      expect(options.zoom).to.eql(10);
    });

    it('applies the current zoom', function() {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setZoom(8);
      const options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.zoom).to.eql(8);
    });

    it('applies the current resolution if resolution was originally supplied', function() {
      const view = new View({
        center: [0, 0],
        resolution: 1000
      });
      view.setResolution(500);
      const options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.resolution).to.eql(500);
    });

    it('applies the current center', function() {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setCenter([1, 2]);
      const options = view.getUpdatedOptions_();

      expect(options.center).to.eql([1, 2]);
      expect(options.zoom).to.eql(10);
    });

    it('applies the current rotation', function() {
      const view = new View({
        center: [0, 0],
        zoom: 10
      });
      view.setRotation(Math.PI / 6);
      const options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.zoom).to.eql(10);
      expect(options.rotation).to.eql(Math.PI / 6);
    });

  });

  describe('#animate()', function() {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function() {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(function() {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    it('can be called to animate view properties', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 25
      }, function(complete) {
        expect(complete).to.be(true);
        expect(view.getCenter()).to.eql([0, 0]);
        expect(view.getZoom()).to.eql(4);
        expect(view.getAnimating()).to.eql(false);
        done();
      });
      expect(view.getAnimating()).to.eql(true);
    });

    it('allows duration to be zero', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 0
      }, function(complete) {
        expect(complete).to.be(true);
        expect(view.getCenter()).to.eql([0, 0]);
        expect(view.getZoom()).to.eql(4);
        expect(view.getAnimating()).to.eql(false);
        done();
      });
    });

    it('immediately completes for no-op animations', function() {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 5,
        center: [0, 0],
        duration: 25
      });
      expect(view.getAnimating()).to.eql(false);
    });

    it('immediately completes if view is not defined before', function() {
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
      expect(view.getAnimating()).to.eql(false);
      expect(view.getCenter()).to.eql(center);
      expect(view.getZoom()).to.eql(zoom);
      expect(view.getRotation()).to.eql(rotation);
    });

    it('sets final animation state if view is not defined before', function() {
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
      expect(view.getAnimating()).to.eql(false);
      expect(view.getCenter()).to.eql(center);
      expect(view.getZoom()).to.eql(zoom);
      expect(view.getRotation()).to.eql(rotation);
    });

    it('prefers zoom over resolution', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        resolution: view.getResolution() * 3,
        duration: 25
      }, function(complete) {
        expect(complete).to.be(true);
        expect(view.getZoom()).to.be(4);
        done();
      });
    });

    it('avoids going under minResolution', function(done) {
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
        expect(complete).to.be(true);
        expect(view.getResolution()).to.be(minResolution);
        expect(view.getZoom()).to.be(maxZoom);
        done();
      });
    });

    it('takes the shortest arc to the target rotation', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 180 * 1
      });
      view.animate({
        rotation: Math.PI / 180 * 359,
        duration: 0
      }, function(complete) {
        expect(complete).to.be(true);
        expect(view.getRotation()).to.roughlyEqual(Math.PI / 180 * -1, 1e-12);
        done();
      });
    });

    it('normalizes rotation to angles between -180 and 180 degrees after the anmiation', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 180 * 1
      });
      view.animate({
        rotation: Math.PI / 180 * -181,
        duration: 0
      }, function(complete) {
        expect(complete).to.be(true);
        expect(view.getRotation()).to.roughlyEqual(Math.PI / 180 * 179, 1e-12);
        done();
      });
    });

    it('calls a callback when animation completes', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 1,
        duration: 25
      }, function(complete) {
        expect(complete).to.be(true);
        done();
      });
    });

    it('allows the callback to trigger another animation', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      function firstCallback(complete) {
        expect(complete).to.be(true);

        view.animate({
          zoom: 2,
          duration: 10
        }, secondCallback);
      }

      function secondCallback(complete) {
        expect(complete).to.be(true);
        done();
      }

      view.animate({
        zoom: 1,
        duration: 25
      }, firstCallback);
    });

    it('calls callback with false when animation is interrupted', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 1,
        duration: 25
      }, function(complete) {
        expect(complete).to.be(false);
        done();
      });

      view.setCenter([1, 2]); // interrupt the animation
    });

    it('calls a callback even if animation is a no-op', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 0,
        duration: 25
      }, function(complete) {
        expect(complete).to.be(true);
        done();
      });
    });

    it('calls a callback if view is not defined before', function(done) {
      const view = new View();

      view.animate({
        zoom: 10,
        duration: 25
      }, function(complete) {
        expect(view.getZoom()).to.be(10);
        expect(complete).to.be(true);
        done();
      });
    });

    it('can run multiple animations in series', function(done) {
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
        expect(checked).to.be(true);
        expect(view.getZoom()).to.roughlyEqual(2, 1e-5);
        expect(view.getCenter()).to.eql([10, 10]);
        expect(complete).to.be(true);
        done();
      });

      setTimeout(function() {
        expect(view.getCenter()).to.eql([0, 0]);
        checked = true;
      }, 10);

    });

    it('properly sets the ANIMATING hint', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      let count = 3;
      function decrement() {
        --count;
        if (count === 0) {
          expect(view.getHints()[ViewHint.ANIMATING]).to.be(0);
          done();
        }
      }
      view.animate({
        center: [1, 2],
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(1);

      view.animate({
        zoom: 1,
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(2);

      view.animate({
        rotation: Math.PI,
        duration: 25
      }, decrement);
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(3);

    });

    it('clears the ANIMATING hint when animations are cancelled', function() {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      view.animate({
        center: [1, 2],
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(1);

      view.animate({
        zoom: 1,
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(2);

      view.animate({
        rotation: Math.PI,
        duration: 25
      });
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(3);

      // cancel animations
      view.setCenter([10, 20]);
      expect(view.getHints()[ViewHint.ANIMATING]).to.be(0);

    });

    it('completes multiple staggered animations run in parallel', function(done) {

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
        expect(view.getZoom() > 0).to.be(true);
        expect(view.getZoom() < 1).to.be(true);
        expect(view.getAnimating()).to.be(true);
        view.animate({
          zoom: 2,
          duration: 50
        }, function() {
          expect(calls).to.be(1);
          expect(view.getZoom()).to.be(2);
          expect(view.getAnimating()).to.be(false);
          done();
        });
      }, 10);

    });

    it('completes complex animation using resolution', function(done) {

      const view = new View({
        center: [0, 0],
        resolution: 2
      });

      let calls = 0;

      function onAnimateEnd() {
        if (calls == 2) {
          expect(view.getAnimating()).to.be(false);
          done();
        }
      }

      view.animate({
        center: [100, 100],
        duration: 50
      }, function() {
        ++calls;
        expect(view.getCenter()).to.eql([100, 100]);
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
        expect(view.getResolution()).to.be(2);
        onAnimateEnd();
      });

      setTimeout(function() {
        expect(view.getResolution() > 2).to.be(true);
        expect(view.getResolution() < 2000).to.be(true);
        expect(view.getAnimating()).to.be(true);
      }, 10);

      setTimeout(function() {
        expect(view.getResolution() > 2).to.be(true);
        expect(view.getResolution() < 2000).to.be(true);
        expect(view.getAnimating()).to.be(true);
      }, 40);

    });

  });

  describe('#cancelAnimations()', function() {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function() {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(function() {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    it('cancels a currently running animation', function(done) {
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
        expect(view.getAnimating()).to.be(true);
        view.once('change', function() {
          expect(view.getAnimating()).to.be(false);
          done();
        });
        view.cancelAnimations();
      }, 10);
    });

    it('cancels a multiple animations', function(done) {
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
        expect(view.getAnimating()).to.be(true);
        view.once('change', function() {
          expect(view.getAnimating()).to.be(false);
          done();
        });
        view.cancelAnimations();
      }, 10);
    });

    it('calls callbacks with false to indicate animations did not complete', function(done) {
      const view = new View({
        center: [0, 0],
        zoom: 0
      });

      view.animate({
        zoom: 10,
        duration: 50
      }, function(complete) {
        expect(view.getAnimating()).to.be(false);
        expect(complete).to.be(false);
        done();
      });

      setTimeout(function() {
        expect(view.getAnimating()).to.be(true);
        view.cancelAnimations();
      }, 10);
    });

  });

  describe('#getResolutions', function() {
    let view;
    const resolutions = [512, 256, 128, 64, 32, 16];

    it('returns correct resolutions', function() {
      view = new View({
        resolutions: resolutions
      });
      expect(view.getResolutions()).to.be(resolutions);
    });

    it('returns resolutions as undefined', function() {
      view = new View();
      expect(view.getResolutions()).to.be(undefined);
    });
  });

  describe('#getZoom', function() {
    let view;
    beforeEach(function() {
      view = new View({
        resolutions: [512, 256, 128, 64, 32, 16]
      });
    });

    it('returns correct zoom levels (with resolutions array)', function() {
      view.setResolution(undefined);
      expect(view.getZoom()).to.be(undefined);

      view.setResolution(513);
      expect(view.getZoom()).to.roughlyEqual(Math.log(512 / 513) / Math.LN2, 1e-9);

      view.setResolution(512);
      expect(view.getZoom()).to.be(0);

      view.setResolution(100);
      expect(view.getZoom()).to.roughlyEqual(2.35614, 1e-5);

      view.setResolution(65);
      expect(view.getZoom()).to.roughlyEqual(2.97763, 1e-5);

      view.setResolution(64);
      expect(view.getZoom()).to.be(3);

      view.setResolution(16);
      expect(view.getZoom()).to.be(5);

      view.setResolution(15);
      expect(view.getZoom()).to.roughlyEqual(Math.log(512 / 15) / Math.LN2, 1e-9);
    });

    it('works for resolution arrays with variable zoom factors', function() {
      const view = new View({
        resolutions: [10, 5, 2, 1]
      });

      view.setZoom(1);
      expect(view.getZoom()).to.be(1);

      view.setZoom(1.3);
      expect(view.getZoom()).to.be(1.3);

      view.setZoom(2);
      expect(view.getZoom()).to.be(2);

      view.setZoom(2.7);
      expect(view.getZoom()).to.be(2.7);

      view.setZoom(3);
      expect(view.getZoom()).to.be(3);

    });
  });

  describe('#getZoom() - constrained', function() {
    it('returns correct zoom levels', function() {
      const view = new View({
        minZoom: 10,
        maxZoom: 20
      });

      view.setZoom(5);
      expect(view.getZoom()).to.be(10);

      view.setZoom(10);
      expect(view.getZoom()).to.be(10);

      view.setZoom(15);
      expect(view.getZoom()).to.be(15);

      view.setZoom(15.3);
      expect(view.getZoom()).to.be(15.3);

      view.setZoom(20);
      expect(view.getZoom()).to.be(20);

      view.setZoom(25);
      expect(view.getZoom()).to.be(20);
    });
  });

  describe('#getZoom() - overspecified', function() {

    it('gives maxResolution precedence over minZoom', function() {

      const view = new View({
        maxResolution: 100,
        minZoom: 2 // this should get ignored
      });

      view.setResolution(100);
      expect(view.getZoom()).to.be(0);

      view.setZoom(0);
      expect(view.getResolution()).to.be(100);
    });
  });

  describe('#getZoomForResolution', function() {

    it('returns correct zoom levels', function() {
      const view = new View();
      const max = view.getMaxResolution();

      expect(view.getZoomForResolution(max)).to.be(0);

      expect(view.getZoomForResolution(max / 2)).to.be(1);

      expect(view.getZoomForResolution(max / 4)).to.be(2);

      expect(view.getZoomForResolution(2 * max)).to.be(-1);
    });

    it('returns correct zoom levels for specifically configured resolutions', function() {
      const view = new View({
        resolutions: [10, 8, 6, 4, 2]
      });

      expect(view.getZoomForResolution(10)).to.be(0);

      expect(view.getZoomForResolution(8)).to.be(1);

      expect(view.getZoomForResolution(6)).to.be(2);

      expect(view.getZoomForResolution(4)).to.be(3);

      expect(view.getZoomForResolution(2)).to.be(4);
    });

  });

  describe('#getResolutionForZoom', function() {

    it('returns correct zoom resolution', function() {
      const view = new View();
      const max = view.getMaxZoom();
      const min = view.getMinZoom();

      expect(view.getResolutionForZoom(max)).to.be(view.getMinResolution());
      expect(view.getResolutionForZoom(min)).to.be(view.getMaxResolution());
    });

    it('returns correct zoom levels for specifically configured resolutions', function() {
      const view = new View({
        resolutions: [10, 8, 6, 4, 2]
      });

      expect(view.getResolutionForZoom(0)).to.be(10);
      expect(view.getResolutionForZoom(1)).to.be(8);
      expect(view.getResolutionForZoom(2)).to.be(6);
      expect(view.getResolutionForZoom(3)).to.be(4);
      expect(view.getResolutionForZoom(4)).to.be(2);
    });

  });

  describe('#getMaxZoom', function() {

    it('returns the zoom level for the min resolution', function() {
      const view = new View();
      expect(view.getMaxZoom()).to.be(view.getZoomForResolution(view.getMinResolution()));
    });

    it('works for a view configured with a maxZoom', function() {
      const view = new View({
        maxZoom: 10
      });
      expect(view.getMaxZoom()).to.be(10);
    });

  });

  describe('#getMinZoom', function() {

    it('returns the zoom level for the max resolution', function() {
      const view = new View();
      expect(view.getMinZoom()).to.be(view.getZoomForResolution(view.getMaxResolution()));
    });

    it('works for views configured with a minZoom', function() {
      const view = new View({
        minZoom: 3
      });
      expect(view.getMinZoom()).to.be(3);
    });

  });

  describe('#setMaxZoom', function() {
    describe('with resolutions property in view', function() {
      it('changes the zoom level when the level is over max zoom', function() {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4
        });

        view.setMaxZoom(2);
        expect(view.getZoom()).to.be(2);
      });
    });

    describe('with no resolutions property in view', function() {
      it('changes the zoom level when the level is over max zoom', function() {
        const view = new View({
          zoom: 4
        });

        view.setMaxZoom(2);
        expect(view.getZoom()).to.be(2);
      });
    });
  });

  describe('#setMinZoom', function() {
    describe('with resolutions property in view', function() {
      it('changes the zoom level when the level is under min zoom', function() {
        const view = new View({
          resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
          zoom: 4
        });

        view.setMinZoom(5);
        expect(view.getZoom()).to.be(5);
      });
    });

    describe('with no resolutions property in view', function() {
      it('changes the zoom level when the level is under min zoom', function() {
        const view = new View({
          zoom: 4
        });

        view.setMinZoom(5);
        expect(view.getZoom()).to.be(5);
      });
    });
  });

  describe('#calculateExtent', function() {
    it('returns the expected extent', function() {
      const view = new View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0]
      });

      const extent = view.calculateExtent([100, 200]);
      expect(extent[0]).to.be(-25600);
      expect(extent[1]).to.be(-51200);
      expect(extent[2]).to.be(25600);
      expect(extent[3]).to.be(51200);
    });
    it('returns the expected extent with rotation', function() {
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

  describe('#getSizeFromViewport_()', function() {
    let map, target;
    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '200px';
      target.style.height = '150px';
      map = new Map({
        target: target
      });
      document.body.appendChild(target);
    });
    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });
    it('calculates the size correctly', function() {
      const size = map.getView().getSizeFromViewport_();
      expect(size).to.eql([200, 150]);
    });
  });

  describe('fit', function() {

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    beforeEach(function() {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 1);
      };
      window.cancelAnimationFrame = function(key) {
        return clearTimeout(key);
      };
    });

    afterEach(function() {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    let view;
    beforeEach(function() {
      view = new View({
        center: [0, 0],
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1],
        zoom: 5
      });
    });
    it('fits correctly to the geometry', function() {
      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100], constrainResolution: false});
      expect(view.getResolution()).to.be(11);
      expect(view.getCenter()[0]).to.be(5950);
      expect(view.getCenter()[1]).to.be(47100);

      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100]});
      expect(view.getResolution()).to.be(20);
      expect(view.getCenter()[0]).to.be(5500);
      expect(view.getCenter()[1]).to.be(47550);

      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100], nearest: true});
      expect(view.getResolution()).to.be(10);
      expect(view.getCenter()[0]).to.be(6000);
      expect(view.getCenter()[1]).to.be(47050);

      view.fit(
        new Point([6000, 46000]),
        {size: [200, 200], padding: [100, 0, 0, 100], minResolution: 2});
      expect(view.getResolution()).to.be(2);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.fit(
        new Point([6000, 46000]),
        {size: [200, 200], padding: [100, 0, 0, 100], maxZoom: 6});
      expect(view.getResolution()).to.be(2);
      expect(view.getZoom()).to.be(6);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.fit(
        new Circle([6000, 46000], 1000),
        {size: [200, 200], constrainResolution: false});
      expect(view.getResolution()).to.be(10);
      expect(view.getCenter()[0]).to.be(6000);
      expect(view.getCenter()[1]).to.be(46000);

      view.setRotation(Math.PI / 8);
      view.fit(
        new Circle([6000, 46000], 1000),
        {size: [200, 200], constrainResolution: false});
      expect(view.getResolution()).to.roughlyEqual(10, 1e-9);
      expect(view.getCenter()[0]).to.roughlyEqual(6000, 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(46000, 1e-9);

      view.setRotation(Math.PI / 4);
      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {size: [200, 200], padding: [100, 0, 0, 100], constrainResolution: false});
      expect(view.getResolution()).to.roughlyEqual(14.849242404917458, 1e-9);
      expect(view.getCenter()[0]).to.roughlyEqual(5200, 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(46300, 1e-9);
    });
    it('fits correctly to the extent', function() {
      view.fit([1000, 1000, 2000, 2000], {size: [200, 200]});
      expect(view.getResolution()).to.be(5);
      expect(view.getCenter()[0]).to.be(1500);
      expect(view.getCenter()[1]).to.be(1500);
    });
    it('throws on invalid geometry/extent value', function() {
      expect(function() {
        view.fit(true, [200, 200]);
      }).to.throwException();
    });
    it('throws on empty extent', function() {
      expect(function() {
        view.fit(createEmpty());
      }).to.throwException();
    });
    it('animates when duration is defined', function(done) {
      view.fit(
        new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
        {
          size: [200, 200],
          padding: [100, 0, 0, 100],
          constrainResolution: false,
          duration: 25
        });

      expect(view.getAnimating()).to.eql(true);

      setTimeout(function() {
        expect(view.getResolution()).to.be(11);
        expect(view.getCenter()[0]).to.be(5950);
        expect(view.getCenter()[1]).to.be(47100);
        expect(view.getAnimating()).to.eql(false);
        done();
      }, 50);

    });
    it('calls a callback when duration is not defined', function(done) {
      view.fit(new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        callback: function(complete) {
          expect(complete).to.be(true);
          done();
        }
      });
    });
    it('calls a callback when animation completes', function(done) {
      view.fit(new LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        duration: 25,
        callback: function(complete) {
          expect(complete).to.be(true);
          done();
        }
      });
    });

  });

  describe('centerOn', function() {
    let view;
    beforeEach(function() {
      view = new View({
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1]
      });
    });
    it('fit correctly to the coordinates', function() {
      view.setResolution(10);
      view.centerOn(
        [6000, 46000],
        [400, 400],
        [300, 300]
      );
      expect(view.getCenter()[0]).to.be(5000);
      expect(view.getCenter()[1]).to.be(47000);

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
});

describe('ol.View.isNoopAnimation()', function() {

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
    it('works for case ' + i, function() {
      const noop = isNoopAnimation(c.animation);
      expect(noop).to.equal(c.noop);
    });
  });
});
