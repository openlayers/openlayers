import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.style.Circle', () => {

  describe('#constructor', () => {

    test('creates a canvas (no fill-style)', () => {
      const style = new CircleStyle({radius: 10});
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
      const style = new CircleStyle({
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

    test('creates a new ol.style.Circle', () => {
      const original = new CircleStyle();
      const clone = original.clone();
      expect(clone).toBeInstanceOf(CircleStyle);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        }),
        radius: 5
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      const clone = original.clone();
      expect(original.getFill().getColor()).toEqual(clone.getFill().getColor());
      expect(original.getOpacity()).toEqual(clone.getOpacity());
      expect(original.getRadius()).toEqual(clone.getRadius());
      expect(original.getScale()).toEqual(clone.getScale());
      expect(original.getStroke().getColor()).toEqual(clone.getStroke().getColor());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new CircleStyle({
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

  describe('#setRadius', () => {
    test('changes the circle radius', () => {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getRadius()).toEqual(10);
      style.setRadius(20);
      expect(style.getRadius()).toEqual(20);
    });
  });

});
