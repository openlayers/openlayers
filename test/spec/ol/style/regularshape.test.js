import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.style.RegularShape', () => {

  describe('#constructor', () => {

    test('can use rotateWithView', () => {
      const style = new RegularShape({
        rotateWithView: true,
        radius: 0
      });
      expect(style.getRotateWithView()).toBe(true);
    });

    test('can use radius', () => {
      const style = new RegularShape({
        radius: 5,
        radius2: 10
      });
      expect(style.getRadius()).toEqual(5);
      expect(style.getRadius2()).toEqual(10);
    });

    test('can use radius1 as an alias for radius', () => {
      const style = new RegularShape({
        radius1: 5,
        radius2: 10
      });
      expect(style.getRadius()).toEqual(5);
      expect(style.getRadius2()).toEqual(10);
    });

    test('creates a canvas (no fill-style)', () => {
      const style = new RegularShape({radius: 10});
      expect(style.getImage()).toBeInstanceOf(HTMLCanvasElement);
      expect(style.getSize()).toEqual([21, 21]);
      expect(style.getImageSize()).toEqual([21, 21]);
      expect(style.getOrigin()).toEqual([0, 0]);
      expect(style.getAnchor()).toEqual([10.5, 10.5]);
      expect(style.getImage()).not.toBe(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).toBeInstanceOf(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).toEqual([21, 21]);
    });

    test('creates a canvas (fill-style)', () => {
      const style = new RegularShape({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).toBeInstanceOf(HTMLCanvasElement);
      expect(style.getSize()).toEqual([21, 21]);
      expect(style.getImageSize()).toEqual([21, 21]);
      expect(style.getOrigin()).toEqual([0, 0]);
      expect(style.getAnchor()).toEqual([10.5, 10.5]);
      expect(style.getImage()).toBe(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).toBeInstanceOf(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).toEqual([21, 21]);
    });

  });

  describe('#clone', () => {

    test('creates a new ol.style.RegularShape', () => {
      const original = new RegularShape({
        points: 5
      });
      const clone = original.clone();
      expect(clone).toBeInstanceOf(RegularShape);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new RegularShape({
        fill: new Fill({
          color: '#319FD3'
        }),
        points: 5,
        radius: 4,
        radius2: 6,
        angle: 1,
        stroke: new Stroke({
          color: '#319FD3'
        }),
        rotation: 2,
        rotateWithView: true
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      const clone = original.clone();
      expect(original.getAngle()).toEqual(clone.getAngle());
      expect(original.getFill().getColor()).toEqual(clone.getFill().getColor());
      expect(original.getOpacity()).toEqual(clone.getOpacity());
      expect(original.getPoints()).toEqual(clone.getPoints());
      expect(original.getRadius()).toEqual(clone.getRadius());
      expect(original.getRadius2()).toEqual(clone.getRadius2());
      expect(original.getRotation()).toEqual(clone.getRotation());
      expect(original.getRotateWithView()).toEqual(clone.getRotateWithView());
      expect(original.getScale()).toEqual(clone.getScale());
      expect(original.getStroke().getColor()).toEqual(clone.getStroke().getColor());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new RegularShape({
          fill: new Fill({
            color: '#319FD3'
          }),
          stroke: new Stroke({
            color: '#319FD3'
          })
        });
        const clone = original.clone();
        expect(original.getFill()).not.toBe(clone.getFill());
        expect(original.getStroke()).not.toBe(clone.getStroke());

        clone.getFill().setColor('#012345');
        clone.getStroke().setColor('#012345');
        expect(original.getFill().getColor()).not.toEqual(clone.getFill().getColor());
        expect(original.getStroke().getColor()).not.toEqual(clone.getStroke().getColor());
      }
    );
  });

});
