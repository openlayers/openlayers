import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Fill from '../../../../../src/ol/style/Fill.js';
import RegularShape from '../../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol/style/RegularShape', function () {
  describe('#constructor', function () {
    it('can use rotateWithView', function () {
      const style = new RegularShape({
        rotateWithView: true,
        radius: 0,
      });
      assert.strictEqual(style.getRotateWithView(), true);
    });

    it('can use radius', function () {
      const style = new RegularShape({
        radius: 5,
        radius2: 10,
      });
      assert.deepEqual(style.getRadius(), 5);
      assert.deepEqual(style.getRadius2(), 10);
    });

    it('creates a canvas (no fill-style)', function () {
      const style = new RegularShape({radius: 10});
      assert.instanceOf(style.getImage(1), HTMLCanvasElement);
      assert.deepEqual(style.getSize(), [20, 20]);
      assert.deepEqual(style.getImageSize(), [20, 20]);
      assert.deepEqual(style.getOrigin(), [0, 0]);
      assert.deepEqual(style.getAnchor(), [10, 10]);
      assert.strictEqual(style.getImage(1), style.getHitDetectionImage());
      assert.instanceOf(style.getHitDetectionImage(), HTMLCanvasElement);
    });

    it('creates a canvas (transparent fill-style)', function () {
      const style = new RegularShape({
        radius: 10,
        fill: new Fill({
          color: 'transparent',
        }),
      });
      assert.instanceOf(style.getImage(1), HTMLCanvasElement);
      assert.strictEqual(style.getImage(1).width, 20);
      assert.strictEqual(style.getImage(2).width, 40);
      assert.strictEqual(style.getPixelRatio(2), 2);
      assert.deepEqual(style.getSize(), [20, 20]);
      assert.deepEqual(style.getImageSize(), [20, 20]);
      assert.deepEqual(style.getOrigin(), [0, 0]);
      assert.deepEqual(style.getAnchor(), [10, 10]);
      assert.notEqual(style.getImage(1), style.getHitDetectionImage());
      assert.instanceOf(style.getHitDetectionImage(), HTMLCanvasElement);
      assert.strictEqual(style.getHitDetectionImage().width, 20);
    });

    it('creates a canvas (non-transparent fill-style)', function () {
      const style = new RegularShape({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00',
        }),
      });
      assert.instanceOf(style.getImage(1), HTMLCanvasElement);
      assert.deepEqual(style.getSize(), [20, 20]);
      assert.deepEqual(style.getImageSize(), [20, 20]);
      assert.deepEqual(style.getOrigin(), [0, 0]);
      assert.deepEqual(style.getAnchor(), [10, 10]);
      assert.strictEqual(style.getImage(1), style.getHitDetectionImage());
      assert.instanceOf(style.getHitDetectionImage(), HTMLCanvasElement);
    });

    it('sets default displacement [0, 0]', function () {
      const style = new RegularShape({
        radius: 5,
      });
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 0);
      assert.deepEqual(style.getDisplacement()[1], 0);
      assert.deepEqual(style.getAnchor(), [5, 5]);
    });
    it('will use the larger radius to calculate the size', function () {
      let style = new RegularShape({
        radius: 10,
        radius2: 5,
      });
      assert.deepEqual(style.getSize(), [20, 20]);
      style = new RegularShape({
        radius: 5,
        radius2: 10,
      });
      assert.deepEqual(style.getSize(), [20, 20]);
    });

    it('can use offset', function () {
      const style = new RegularShape({
        radius: 5,
        displacement: [10, 20],
      });
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 10);
      assert.deepEqual(style.getDisplacement()[1], 20);
      assert.deepEqual(style.getAnchor(), [-5, 25]);
      style.setDisplacement([20, 10]);
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 20);
      assert.deepEqual(style.getDisplacement()[1], 10);
      assert.deepEqual(style.getAnchor(), [-15, 15]);
    });

    it('scale applies to rendered radius, not offset', function () {
      let style;

      style = new RegularShape({
        radius: 5,
        displacement: [10, 20],
        scale: 4,
      });
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 10);
      assert.deepEqual(style.getDisplacement()[1], 20);
      assert.deepEqual(style.getAnchor(), [2.5, 10]);
      style.setDisplacement([20, 10]);
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 20);
      assert.deepEqual(style.getDisplacement()[1], 10);
      assert.deepEqual(style.getAnchor(), [0, 7.5]);

      style = new RegularShape({
        radius: 20,
        displacement: [10, 20],
      });
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 10);
      assert.deepEqual(style.getDisplacement()[1], 20);
      assert.deepEqual(style.getAnchor(), [10, 40]);
      style.setDisplacement([20, 10]);
      assert.isArray(style.getDisplacement());
      assert.deepEqual(style.getDisplacement()[0], 20);
      assert.deepEqual(style.getDisplacement()[1], 10);
      assert.deepEqual(style.getAnchor(), [0, 30]);
    });
  });

  describe('#clone', function () {
    it('creates a new ol.style.RegularShape', function () {
      const original = new RegularShape({
        points: 5,
      });
      const clone = original.clone();
      assert.instanceOf(clone, RegularShape);
      assert.notEqual(clone, original);
    });

    it('copies all values', function () {
      const original = new RegularShape({
        fill: new Fill({
          color: '#319FD3',
        }),
        points: 5,
        radius: 4,
        radius2: 6,
        angle: 1,
        stroke: new Stroke({
          color: '#319FD3',
        }),
        rotation: 2,
        rotateWithView: true,
        displacement: [10, 20],
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      const clone = original.clone();
      assert.deepEqual(original.getAngle(), clone.getAngle());
      assert.deepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.deepEqual(original.getOpacity(), clone.getOpacity());
      assert.deepEqual(original.getPoints(), clone.getPoints());
      assert.deepEqual(original.getRadius(), clone.getRadius());
      assert.deepEqual(original.getRadius2(), clone.getRadius2());
      assert.deepEqual(original.getRotation(), clone.getRotation());
      assert.deepEqual(original.getRotateWithView(), clone.getRotateWithView());
      assert.deepEqual(original.getScale(), clone.getScale());
      assert.deepEqual(
        original.getStroke().getColor(),
        clone.getStroke().getColor(),
      );
      assert.deepEqual(
        original.getDisplacement()[0],
        clone.getDisplacement()[0],
      );
      assert.deepEqual(
        original.getDisplacement()[1],
        clone.getDisplacement()[1],
      );
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new RegularShape({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        displacement: [0, 5],
      });
      const clone = original.clone();
      assert.notEqual(original.getFill(), clone.getFill());
      assert.notEqual(original.getStroke(), clone.getStroke());
      assert.notEqual(original.getDisplacement(), clone.getDisplacement());

      clone.getFill().setColor('#012345');
      clone.getStroke().setColor('#012345');
      assert.notDeepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.notDeepEqual(
        original.getStroke().getColor(),
        clone.getStroke().getColor(),
      );
    });
  });

  describe('#createPath_', function () {
    let canvas;
    beforeEach(function () {
      canvas = {
        arc: sinonSpy(),
        lineTo: sinonSpy(),
        closePath: sinonSpy(),
      };
    });
    it('does not double the points without radius2', function () {
      const style = new RegularShape({
        radius: 10,
        points: 4,
      });
      style.createPath_(canvas);
      assert.strictEqual(canvas.arc.callCount, 0);
      assert.strictEqual(canvas.lineTo.callCount, 4);
      assert.strictEqual(canvas.closePath.callCount, 1);
    });
    it('doubles the points with radius2', function () {
      const style = new RegularShape({
        radius: 10,
        radius2: 12,
        points: 4,
      });
      style.createPath_(canvas);
      assert.strictEqual(canvas.arc.callCount, 0);
      assert.strictEqual(canvas.lineTo.callCount, 8);
      assert.strictEqual(canvas.closePath.callCount, 1);
    });
    it('doubles the points when radius2 equals radius', function () {
      const style = new RegularShape({
        radius: 10,
        radius2: 10,
        points: 4,
      });
      style.createPath_(canvas);
      assert.strictEqual(canvas.arc.callCount, 0);
      assert.strictEqual(canvas.lineTo.callCount, 8);
      assert.strictEqual(canvas.closePath.callCount, 1);
    });
  });

  describe('#calculateLineJoinSize_', function () {
    function create({
      radius = 10,
      radius2,
      points = 4,
      strokeWidth = 10,
      lineJoin = 'miter',
      miterLimit = 10,
    }) {
      return new RegularShape({
        radius,
        radius2,
        points,
        stroke: new Stroke({
          color: 'red',
          width: strokeWidth,
          lineJoin,
          miterLimit,
        }),
      });
    }
    describe('polygon', function () {
      it('sets size to diameter', function () {
        const style = create({strokeWidth: 0});
        assert.deepEqual(style.getSize(), [20, 20]);
      });
      it('sets size to diameter rounded up', function () {
        const style = create({radius: 9.9, strokeWidth: 0});
        assert.deepEqual(style.getSize(), [20, 20]);
      });
      it('sets size to diameter plus miter', function () {
        const style = create({});
        assert.deepEqual(style.getSize(), [35, 35]);
      });
      it('sets size to diameter plus miter with miter limit', function () {
        const style = create({miterLimit: 0});
        assert.deepEqual(style.getSize(), [28, 28]);
      });
      it('sets size to diameter plus bevel', function () {
        const style = create({lineJoin: 'bevel'});
        assert.deepEqual(style.getSize(), [28, 28]);
      });
      it('sets size to diameter plus stroke width with round line join', function () {
        const style = create({lineJoin: 'round'});
        assert.deepEqual(style.getSize(), [30, 30]);
      });
    });
    describe('star', function () {
      it('sets size to diameter plus miter r1 > r2', function () {
        const style = create({radius2: 1, miterLimit: 100});
        assert.deepEqual(style.getSize(), [152, 152]);
      });
      it('sets size to diameter plus miter r1 < r2', function () {
        const style = create({radius2: 2, points: 7, miterLimit: 100});
        assert.deepEqual(style.getSize(), [116, 116]);
      });
      it('sets size with spokes through center and outer bevel', function () {
        const style = create({radius2: 80, points: 9, strokeWidth: 90});
        assert.deepEqual(style.getSize(), [213, 213]);
      });
    });
  });
});
