import {assert} from 'chai';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import {shared as iconImageCache} from '../../../../../src/ol/style/IconImageCache.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol/style/Circle', function () {
  beforeEach(function () {
    iconImageCache.clear();
  });

  describe('#constructor', function () {
    it('creates a canvas (no fill-style)', function () {
      const style = new CircleStyle({radius: 10});
      assert.instanceOf(style.getImage(1), HTMLCanvasElement);
      assert.deepEqual(style.getSize(), [20, 20]);
      assert.deepEqual(style.getImageSize(), [20, 20]);
      assert.deepEqual(style.getOrigin(), [0, 0]);
      assert.deepEqual(style.getAnchor(), [10, 10]);
      assert.strictEqual(style.getImage(1), style.getHitDetectionImage());
      assert.instanceOf(style.getHitDetectionImage(), HTMLCanvasElement);
    });

    it('creates a canvas (transparent fill-style)', function () {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: 'transparent',
        }),
      });
      assert.instanceOf(style.getImage(1), HTMLCanvasElement);
      assert.deepEqual(style.getSize(), [20, 20]);
      assert.deepEqual(style.getImageSize(), [20, 20]);
      assert.deepEqual(style.getOrigin(), [0, 0]);
      assert.deepEqual(style.getAnchor(), [10, 10]);
      assert.notEqual(style.getImage(1), style.getHitDetectionImage());
      assert.instanceOf(style.getHitDetectionImage(), HTMLCanvasElement);
    });

    it('creates a canvas (non-transparent fill-style)', function () {
      const style = new CircleStyle({
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
  });

  describe('#clone', function () {
    it('creates a new ol.style.Circle', function () {
      const original = new CircleStyle();
      const clone = original.clone();
      assert.instanceOf(clone, CircleStyle);
      assert.notEqual(clone, original);
    });

    it('copies all values', function () {
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        radius: 5,
        scale: [1.5, 1],
        rotation: 2,
        rotateWithView: true,
        displacement: [10, 20],
      });
      original.setOpacity(0.5);
      const clone = original.clone();
      assert.deepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.deepEqual(original.getOpacity(), clone.getOpacity());
      assert.deepEqual(original.getRadius(), clone.getRadius());
      assert.deepEqual(original.getRotation(), clone.getRotation());
      assert.deepEqual(original.getRotateWithView(), clone.getRotateWithView());
      assert.deepEqual(original.getScale()[0], clone.getScale()[0]);
      assert.deepEqual(original.getScale()[1], clone.getScale()[1]);
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
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        scale: [1.5, 1],
        displacement: [0, 5],
      });
      const clone = original.clone();
      assert.notEqual(original.getFill(), clone.getFill());
      assert.notEqual(original.getStroke(), clone.getStroke());
      assert.notEqual(original.getScale(), clone.getScale());
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

  describe('#setRadius', function () {
    it('changes the circle radius', function () {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00',
        }),
      });
      assert.deepEqual(style.getRadius(), 10);

      const hitImageBefore = style.getHitDetectionImage();
      assert.instanceOf(hitImageBefore, HTMLCanvasElement);
      assert.deepEqual(hitImageBefore.width, 20);

      style.setRadius(20);
      assert.deepEqual(style.getRadius(), 20);

      const hitImageAfter = style.getHitDetectionImage();
      assert.instanceOf(hitImageAfter, HTMLCanvasElement);
      assert.deepEqual(hitImageAfter.width, 40);
    });
  });
});
