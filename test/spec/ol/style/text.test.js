import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Text from '../../../../src/ol/style/Text.js';


describe('ol.style.Text', () => {

  describe('#constructor', () => {

    test('uses a default fill style if none passed', () => {
      const style = new Text();
      expect(style.getFill().getColor()).toBe('#333');
    });

    test('uses a provided fill style if one passed', () => {
      const style = new Text({
        fill: new Fill({color: '#123456'})
      });
      expect(style.getFill().getColor()).toBe('#123456');
    });

    test('can always be resetted to no color', () => {
      const style = new Text();
      style.getFill().setColor();
      expect(style.getFill().getColor()).toBe(undefined);
    });

  });

  describe('#clone', () => {

    test('creates a new ol.style.Text', () => {
      const original = new Text();
      const clone = original.clone();
      expect(clone).toBeInstanceOf(Text);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new Text({
        font: '12px serif',
        offsetX: 4,
        offsetY: 10,
        scale: 2,
        rotateWithView: true,
        rotation: 1.5,
        text: 'test',
        textAlign: 'center',
        textBaseline: 'top',
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        }),
        backgroundFill: new Fill({
          color: 'white'
        }),
        backgroundStroke: new Stroke({
          color: 'black'
        }),
        padding: [10, 11, 12, 13]
      });
      const clone = original.clone();
      expect(original.getFont()).toEqual(clone.getFont());
      expect(original.getOffsetX()).toEqual(clone.getOffsetX());
      expect(original.getOffsetY()).toEqual(clone.getOffsetY());
      expect(original.getScale()).toEqual(clone.getScale());
      expect(original.getRotateWithView()).toEqual(clone.getRotateWithView());
      expect(original.getRotation()).toEqual(clone.getRotation());
      expect(original.getText()).toEqual(clone.getText());
      expect(original.getTextAlign()).toEqual(clone.getTextAlign());
      expect(original.getTextBaseline()).toEqual(clone.getTextBaseline());
      expect(original.getStroke().getColor()).toEqual(clone.getStroke().getColor());
      expect(original.getFill().getColor()).toEqual(clone.getFill().getColor());
      expect(original.getBackgroundStroke().getColor()).toEqual(clone.getBackgroundStroke().getColor());
      expect(original.getBackgroundFill().getColor()).toEqual(clone.getBackgroundFill().getColor());
      expect(original.getPadding()).toEqual(clone.getPadding());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new Text({
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

  describe('#setRotateWithView', () => {
    test('sets the rotateWithView property', () => {
      const textStyle = new Text();
      expect(textStyle.getRotateWithView()).toEqual(undefined);
      textStyle.setRotateWithView(true);
      expect(textStyle.getRotateWithView()).toEqual(true);
    });
  });

});
