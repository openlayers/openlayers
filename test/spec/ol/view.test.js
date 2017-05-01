goog.provide('ol.test.View');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');

describe('ol.View', function() {

  describe('constructor (defaults)', function() {
    var view;

    beforeEach(function() {
      view = new ol.View();
    });

    it('creates an instance', function() {
      expect(view).to.be.a(ol.View);
    });

    it('provides default rotation', function() {
      expect(view.getRotation()).to.be(0);
    });

  });

  describe('create constraints', function() {

    describe('create center constraint', function() {

      describe('with no options', function() {
        it('gives a correct center constraint function', function() {
          var options = {};
          var fn = ol.View.createCenterConstraint_(options);
          expect(fn([0, 0])).to.eql([0, 0]);
          expect(fn(undefined)).to.eql(undefined);
          expect(fn([42, -100])).to.eql([42, -100]);
        });
      });

      describe('with extent option', function() {
        it('gives a correct center constraint function', function() {
          var options = {
            extent: [0, 0, 1, 1]
          };
          var fn = ol.View.createCenterConstraint_(options);
          expect(fn([0, 0])).to.eql([0, 0]);
          expect(fn([-10, 0])).to.eql([0, 0]);
          expect(fn([100, 100])).to.eql([1, 1]);
        });
      });

    });

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {};
          var fn = ol.View.createResolutionConstraint_(options).constraint;
          expect(fn(156543.03392804097, 0, 0))
              .to.roughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0, 0))
              .to.roughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, maxZoom, and zoomFactor options',
          function() {
            it('gives a correct resolution constraint function', function() {
              var options = {
                maxResolution: 81,
                maxZoom: 3,
                zoomFactor: 3
              };
              var info = ol.View.createResolutionConstraint_(options);
              var maxResolution = info.maxResolution;
              expect(maxResolution).to.eql(81);
              var minResolution = info.minResolution;
              expect(minResolution).to.eql(3);
              var fn = info.constraint;
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
          var options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          var info = ol.View.createResolutionConstraint_(options);
          var maxResolution = info.maxResolution;
          expect(maxResolution).to.eql(97);
          var minResolution = info.minResolution;
          expect(minResolution).to.eql(0.45);
          var fn = info.constraint;
          expect(fn(97, 0, 0)).to.eql(97);
          expect(fn(76, 0, 0)).to.eql(76);
          expect(fn(65, 0, 0)).to.eql(65);
          expect(fn(54, 0, 0)).to.eql(54);
          expect(fn(0.45, 0, 0)).to.eql(0.45);
        });
      });

      describe('with zoom related options', function() {

        var defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return ol.View.createResolutionConstraint_(options).constraint;
        }

        it('works with only maxZoom', function() {
          var maxZoom = 10;
          var constraint = getConstraint({
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
              defaultMaxRes, 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
              defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        it('works with only minZoom', function() {
          var minZoom = 5;
          var constraint = getConstraint({
            minZoom: minZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
              defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
              defaultMaxRes / Math.pow(2, 28), 1e-9);
        });

        it('works with maxZoom and minZoom', function() {
          var minZoom = 2;
          var maxZoom = 11;
          var constraint = getConstraint({
            minZoom: minZoom,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
              defaultMaxRes / Math.pow(2, minZoom), 1e-9);

          expect(constraint(0, 0, 0)).to.roughlyEqual(
              defaultMaxRes / Math.pow(2, maxZoom), 1e-9);
        });

        it('works with maxZoom, minZoom, and zoomFactor', function() {
          var minZoom = 4;
          var maxZoom = 8;
          var zoomFactor = 3;
          var constraint = getConstraint({
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

        var defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return ol.View.createResolutionConstraint_(options).constraint;
        }

        it('works with only maxResolution', function() {
          var maxResolution = 10e6;
          var constraint = getConstraint({
            maxResolution: maxResolution
          });

          expect(constraint(maxResolution * 3, 0, 0)).to.roughlyEqual(
              maxResolution, 1e-9);

          var minResolution = constraint(0, 0, 0);
          var defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).to.be.greaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).to.be.lessThan(2);
        });

        it('works with only minResolution', function() {
          var minResolution = 100;
          var constraint = getConstraint({
            minResolution: minResolution
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
              defaultMaxRes, 1e-9);

          var constrainedMinRes = constraint(0, 0, 0);
          expect(constrainedMinRes).to.be.greaterThan(minResolution);
          expect(constrainedMinRes / minResolution).to.be.lessThan(2);
        });

        it('works with minResolution and maxResolution', function() {
          var constraint = getConstraint({
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
          var constraint = getConstraint({
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

        var defaultMaxRes = 156543.03392804097;
        function getConstraint(options) {
          return ol.View.createResolutionConstraint_(options).constraint;
        }

        it('respects maxResolution over minZoom', function() {
          var maxResolution = 10e6;
          var minZoom = 8;
          var constraint = getConstraint({
            maxResolution: maxResolution,
            minZoom: minZoom
          });

          expect(constraint(maxResolution * 3, 0, 0)).to.roughlyEqual(
              maxResolution, 1e-9);

          var minResolution = constraint(0, 0, 0);
          var defaultMinRes = defaultMaxRes / Math.pow(2, 28);

          expect(minResolution).to.be.greaterThan(defaultMinRes);
          expect(minResolution / defaultMinRes).to.be.lessThan(2);
        });

        it('respects minResolution over maxZoom', function() {
          var minResolution = 100;
          var maxZoom = 50;
          var constraint = getConstraint({
            minResolution: minResolution,
            maxZoom: maxZoom
          });

          expect(constraint(defaultMaxRes, 0, 0)).to.roughlyEqual(
              defaultMaxRes, 1e-9);

          var constrainedMinRes = constraint(0, 0, 0);
          expect(constrainedMinRes).to.be.greaterThan(minResolution);
          expect(constrainedMinRes / minResolution).to.be.lessThan(2);
        });

      });

    });

    describe('create rotation constraint', function() {
      it('gives a correct rotation constraint function', function() {
        var options = {};
        var fn = ol.View.createRotationConstraint_(options);
        expect(fn(0.01, 0)).to.eql(0);
        expect(fn(0.15, 0)).to.eql(0.15);
      });
    });

  });

  describe('#setHint()', function() {

    it('changes a view hint', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 0
      });

      expect(view.getHints()).to.eql([0, 0]);
      expect(view.getInteracting()).to.eql(false);

      view.setHint(ol.ViewHint.INTERACTING, 1);
      expect(view.getHints()).to.eql([0, 1]);
      expect(view.getInteracting()).to.eql(true);
    });

    it('triggers the change event', function(done) {
      var view = new ol.View({
        center: [0, 0],
        zoom: 0
      });

      view.on('change', function() {
        expect(view.getHints()).to.eql([0, 1]);
        expect(view.getInteracting()).to.eql(true);
        done();
      });
      view.setHint(ol.ViewHint.INTERACTING, 1);
    });

  });

  describe('#getUpdatedOptions_()', function() {

    it('applies minZoom to constructor options', function() {
      var view = new ol.View({
        center: [0, 0],
        minZoom: 2,
        zoom: 10
      });
      var options = view.getUpdatedOptions_({minZoom: 3});

      expect(options.center).to.eql([0, 0]);
      expect(options.minZoom).to.eql(3);
      expect(options.zoom).to.eql(10);
    });

    it('applies the current zoom', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 10
      });
      view.setZoom(8);
      var options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.zoom).to.eql(8);
    });

    it('applies the current resolution if resolution was originally supplied', function() {
      var view = new ol.View({
        center: [0, 0],
        resolution: 1000
      });
      view.setResolution(500);
      var options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.resolution).to.eql(500);
    });

    it('applies the current center', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 10
      });
      view.setCenter([1, 2]);
      var options = view.getUpdatedOptions_();

      expect(options.center).to.eql([1, 2]);
      expect(options.zoom).to.eql(10);
    });

    it('applies the current rotation', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 10
      });
      view.setRotation(Math.PI / 6);
      var options = view.getUpdatedOptions_();

      expect(options.center).to.eql([0, 0]);
      expect(options.zoom).to.eql(10);
      expect(options.rotation).to.eql(Math.PI / 6);
    });

  });

  describe('#animate()', function() {

    var originalRequestAnimationFrame = window.requestAnimationFrame;
    var originalCancelAnimationFrame = window.cancelAnimationFrame;

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
      var view = new ol.View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 25
      });
      expect(view.getAnimating()).to.eql(true);

      setTimeout(function() {
        expect(view.getCenter()).to.eql([0, 0]);
        expect(view.getZoom()).to.eql(4);
        expect(view.getAnimating()).to.eql(false);
        done();
      }, 50);
    });

    it('allows duration to be zero', function(done) {
      var view = new ol.View({
        center: [0, 0],
        zoom: 5
      });

      view.animate({
        zoom: 4,
        duration: 0
      });

      setTimeout(function() {
        expect(view.getCenter()).to.eql([0, 0]);
        expect(view.getZoom()).to.eql(4);
        expect(view.getAnimating()).to.eql(false);
        done();
      }, 10);
    });

    it('prefers zoom over resolution', function(done) {
      var view = new ol.View({
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
      var maxZoom = 14;
      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        maxZoom: maxZoom
      });

      var minResolution = view.getMinResolution();
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

    it('calls a callback when animation completes', function(done) {
      var view = new ol.View({
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

    it('calls callback with false when animation is interrupted', function(done) {
      var view = new ol.View({
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

    it('can run multiple animations in series', function(done) {
      var view = new ol.View({
        center: [0, 0],
        zoom: 0
      });

      var checked = false;

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
      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      var count = 3;
      function decrement() {
        --count;
        if (count === 0) {
          expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(0);
          done();
        }
      }
      view.animate({
        center: [1, 2],
        duration: 25
      }, decrement);
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(1);

      view.animate({
        zoom: 1,
        duration: 25
      }, decrement);
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(2);

      view.animate({
        rotate: Math.PI,
        duration: 25
      }, decrement);
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(3);

    });

    it('clears the ANIMATING hint when animations are cancelled', function() {
      var view = new ol.View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });

      view.animate({
        center: [1, 2],
        duration: 25
      });
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(1);

      view.animate({
        zoom: 1,
        duration: 25
      });
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(2);

      view.animate({
        rotate: Math.PI,
        duration: 25
      });
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(3);

      // cancel animations
      view.setCenter([10, 20]);
      expect(view.getHints()[ol.ViewHint.ANIMATING]).to.be(0);

    });

    it('completes multiple staggered animations run in parallel', function(done) {

      var view = new ol.View({
        center: [0, 0],
        zoom: 0
      });

      var calls = 0;

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
          duration: 25
        }, function() {
          expect(calls).to.be(1);
          expect(view.getZoom()).to.be(2);
          expect(view.getAnimating()).to.be(false);
          done();
        });
      }, 10);

    });

    it('completes complex animation using resolution', function(done) {

      var view = new ol.View({
        center: [0, 0],
        resolution: 2
      });

      var calls = 0;

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

    var originalRequestAnimationFrame = window.requestAnimationFrame;
    var originalCancelAnimationFrame = window.cancelAnimationFrame;

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
      var view = new ol.View({
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
      var view = new ol.View({
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
      var view = new ol.View({
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
    var view;
    var resolutions = [512, 256, 128, 64, 32, 16];

    it('returns correct resolutions', function() {
      view = new ol.View({
        resolutions: resolutions
      });
      expect(view.getResolutions()).to.be(resolutions);
    });

    it('returns resolutions as undefined', function() {
      view = new ol.View();
      expect(view.getResolutions()).to.be(undefined);
    });
  });

  describe('#getZoom', function() {
    var view;
    beforeEach(function() {
      view = new ol.View({
        resolutions: [512, 256, 128, 64, 32, 16]
      });
    });

    it('returns correct zoom levels', function() {
      view.setResolution(undefined);
      expect(view.getZoom()).to.be(undefined);

      view.setResolution(513);
      expect(view.getZoom()).to.be(undefined);

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
      expect(view.getZoom()).to.be(undefined);
    });

    it('works for resolution arrays with variable zoom factors', function() {
      var view = new ol.View({
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
      var view = new ol.View({
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

  describe('#getZoom() - custom ol.DEFAULT_MIN_ZOOM', function() {
    var defaultMinZoom = ol.DEFAULT_MIN_ZOOM;

    afterEach(function() {
      ol.DEFAULT_MIN_ZOOM = defaultMinZoom;
    });

    it('respects custom ol.DEFAULT_MIN_ZOOM', function() {
      ol.DEFAULT_MIN_ZOOM = 2;

      var view = new ol.View();

      view.setZoom(1);
      expect(view.getZoom()).to.be(2);

      view.setZoom(2);
      expect(view.getZoom()).to.be(2);

      view.setZoom(3);
      expect(view.getZoom()).to.be(3);
    });
  });

  describe('#getZoom() - overspecified', function() {

    it('gives maxResolution precedence over minZoom', function() {

      var view = new ol.View({
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
      var view = new ol.View();
      var max = view.getMaxResolution();

      expect(view.getZoomForResolution(max)).to.be(0);

      expect(view.getZoomForResolution(max / 2)).to.be(1);

      expect(view.getZoomForResolution(max / 4)).to.be(2);
    });

    it('returns correct zoom levels for specifically configured resolutions', function() {
      var view = new ol.View({
        resolutions: [10, 8, 6, 4, 2]
      });

      expect(view.getZoomForResolution(10)).to.be(0);

      expect(view.getZoomForResolution(8)).to.be(1);

      expect(view.getZoomForResolution(6)).to.be(2);

      expect(view.getZoomForResolution(4)).to.be(3);

      expect(view.getZoomForResolution(2)).to.be(4);
    });

  });

  describe('#getMaxZoom', function() {

    it('returns the zoom level for the min resolution', function() {
      var view = new ol.View();
      expect(view.getMaxZoom()).to.be(view.getZoomForResolution(view.getMinResolution()));
    });

    it('works for a view configured with a maxZoom', function() {
      var view = new ol.View({
        maxZoom: 10
      });
      expect(view.getMaxZoom()).to.be(10);
    });

  });

  describe('#getMinZoom', function() {

    it('returns the zoom level for the max resolution', function() {
      var view = new ol.View();
      expect(view.getMinZoom()).to.be(view.getZoomForResolution(view.getMaxResolution()));
    });

    it('works for views configured with a minZoom', function() {
      var view = new ol.View({
        minZoom: 3
      });
      expect(view.getMinZoom()).to.be(3);
    });

  });

  describe('#calculateExtent', function() {
    it('returns the expected extent', function() {
      var view = new ol.View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0]
      });

      var extent = view.calculateExtent([100, 200]);
      expect(extent[0]).to.be(-25600);
      expect(extent[1]).to.be(-51200);
      expect(extent[2]).to.be(25600);
      expect(extent[3]).to.be(51200);
    });
    it('returns the expected extent with rotation', function() {
      var view = new ol.View({
        resolutions: [512],
        zoom: 0,
        center: [0, 0],
        rotation: Math.PI / 2
      });
      var extent = view.calculateExtent([100, 200]);
      expect(extent[0]).to.roughlyEqual(-51200, 1e-9);
      expect(extent[1]).to.roughlyEqual(-25600, 1e-9);
      expect(extent[2]).to.roughlyEqual(51200, 1e-9);
      expect(extent[3]).to.roughlyEqual(25600, 1e-9);
    });
  });

  describe('#getSizeFromViewport_()', function() {
    var map, target;
    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '200px';
      target.style.height = '150px';
      map = new ol.Map({
        target: target
      });
      document.body.appendChild(target);
    });
    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });
    it('calculates the size correctly', function() {
      var size = map.getView().getSizeFromViewport_();
      expect(size).to.eql([200, 150]);
    });
  });

  describe('fit', function() {

    var originalRequestAnimationFrame = window.requestAnimationFrame;
    var originalCancelAnimationFrame = window.cancelAnimationFrame;

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

    var view;
    beforeEach(function() {
      view = new ol.View({
        center: [0, 0],
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1],
        zoom: 5
      });
    });
    it('fits correctly to the geometry', function() {
      view.fit(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          {size: [200, 200], padding: [100, 0, 0, 100], constrainResolution: false});
      expect(view.getResolution()).to.be(11);
      expect(view.getCenter()[0]).to.be(5950);
      expect(view.getCenter()[1]).to.be(47100);

      view.fit(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          {size: [200, 200], padding: [100, 0, 0, 100]});
      expect(view.getResolution()).to.be(20);
      expect(view.getCenter()[0]).to.be(5500);
      expect(view.getCenter()[1]).to.be(47550);

      view.fit(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          {size: [200, 200], padding: [100, 0, 0, 100], nearest: true});
      expect(view.getResolution()).to.be(10);
      expect(view.getCenter()[0]).to.be(6000);
      expect(view.getCenter()[1]).to.be(47050);

      view.fit(
          new ol.geom.Point([6000, 46000]),
          {size: [200, 200], padding: [100, 0, 0, 100], minResolution: 2});
      expect(view.getResolution()).to.be(2);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.fit(
          new ol.geom.Point([6000, 46000]),
          {size: [200, 200], padding: [100, 0, 0, 100], maxZoom: 6});
      expect(view.getResolution()).to.be(2);
      expect(view.getZoom()).to.be(6);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.fit(
          new ol.geom.Circle([6000, 46000], 1000),
          {size: [200, 200], constrainResolution: false});
      expect(view.getResolution()).to.be(10);
      expect(view.getCenter()[0]).to.be(6000);
      expect(view.getCenter()[1]).to.be(46000);

      view.setRotation(Math.PI / 8);
      view.fit(
          new ol.geom.Circle([6000, 46000], 1000),
          {size: [200, 200], constrainResolution: false});
      expect(view.getResolution()).to.roughlyEqual(10, 1e-9);
      expect(view.getCenter()[0]).to.roughlyEqual(6000, 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(46000, 1e-9);

      view.setRotation(Math.PI / 4);
      view.fit(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
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
        view.fit(ol.extent.createEmpty());
      }).to.throwException();
    });
    it('animates when duration is defined', function(done) {
      view.fit(
        new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
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
      view.fit(new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        callback: function(complete) {
          expect(complete).to.be(true);
          done();
        }
      });
    });
    it('calls a callback when animation completes', function(done) {
      view.fit(new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]), {
        duration: 25,
        callback: function(complete) {
          expect(complete).to.be(true);
          done();
        }
      });
    });

  });

  describe('centerOn', function() {
    var view;
    beforeEach(function() {
      view = new ol.View({
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
