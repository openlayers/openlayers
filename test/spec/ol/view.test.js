goog.provide('ol.test.View');

describe('ol.View', function() {
  describe('create constraints', function() {

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

      view.setResolution(511);
      expect(view.getZoom()).to.be(undefined);

      view.setResolution(512);
      expect(view.getZoom()).to.be(0);

      view.setResolution(64);
      expect(view.getZoom()).to.be(3);

      view.setResolution(65);
      expect(view.getZoom()).to.be(undefined);

      view.setResolution(16);
      expect(view.getZoom()).to.be(5);

      view.setResolution(15);
      expect(view.getZoom()).to.be(undefined);
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

  describe('fitGeometry', function() {
    var view;
    beforeEach(function() {
      view = new ol.View({
        resolutions: [200, 100, 50, 20, 10, 5, 2, 1]
      });
    });
    it('fit correctly to the geometry', function() {
      view.fitGeometry(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          [200, 200],
          {
            padding: [100, 0, 0, 100],
            constrainResolution: false
          }
      );
      expect(view.getResolution()).to.be(11);
      expect(view.getCenter()[0]).to.be(5950);
      expect(view.getCenter()[1]).to.be(47100);

      view.fitGeometry(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          [200, 200],
          {
            padding: [100, 0, 0, 100]
          }
      );
      expect(view.getResolution()).to.be(20);
      expect(view.getCenter()[0]).to.be(5500);
      expect(view.getCenter()[1]).to.be(47550);

      view.fitGeometry(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          [200, 200],
          {
            padding: [100, 0, 0, 100],
            nearest: true
          }
      );
      expect(view.getResolution()).to.be(10);
      expect(view.getCenter()[0]).to.be(6000);
      expect(view.getCenter()[1]).to.be(47050);

      view.fitGeometry(
          new ol.geom.Point([6000, 46000]),
          [200, 200],
          {
            padding: [100, 0, 0, 100],
            minResolution: 2
          }
      );
      expect(view.getResolution()).to.be(2);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.fitGeometry(
          new ol.geom.Point([6000, 46000]),
          [200, 200],
          {
            padding: [100, 0, 0, 100],
            maxZoom: 6
          }
      );
      expect(view.getResolution()).to.be(2);
      expect(view.getZoom()).to.be(6);
      expect(view.getCenter()[0]).to.be(5900);
      expect(view.getCenter()[1]).to.be(46100);

      view.setRotation(Math.PI / 4);
      view.fitGeometry(
          new ol.geom.LineString([[6000, 46000], [6000, 47100], [7000, 46000]]),
          [200, 200],
          {
            padding: [100, 0, 0, 100],
            constrainResolution: false
          }
      );
      expect(view.getResolution()).to.roughlyEqual(14.849242404917458, 1e-9);
      expect(view.getCenter()[0]).to.roughlyEqual(5200, 1e-9);
      expect(view.getCenter()[1]).to.roughlyEqual(46300, 1e-9);
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

goog.require('ol.View');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
