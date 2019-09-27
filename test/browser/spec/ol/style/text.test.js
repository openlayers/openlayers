import {assert} from 'chai';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Text from '../../../../../src/ol/style/Text.js';

describe('ol.style.Text', function () {
  describe('#constructor', function () {
    it('uses a default fill style if none passed', function () {
      const style = new Text();
      assert.strictEqual(style.getFill().getColor(), '#333');
    });

    it('uses a provided fill style if one passed', function () {
      const style = new Text({
        fill: new Fill({color: '#123456'}),
      });
      assert.strictEqual(style.getFill().getColor(), '#123456');
    });

    it('can always be reset to no color', function () {
      const style = new Text();
      style.getFill().setColor();
      assert.strictEqual(style.getFill().getColor(), undefined);
    });
  });

  describe('#clone', function () {
    it('creates a new ol.style.Text', function () {
      const original = new Text();
      const clone = original.clone();
      assert.instanceOf(clone, Text);
      assert.notEqual(clone, original);
    });

    it('copies all values', function () {
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
        repeat: 250,
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        backgroundFill: new Fill({
          color: 'white',
        }),
        backgroundStroke: new Stroke({
          color: 'black',
        }),
        padding: [10, 11, 12, 13],
      });
      const clone = original.clone();
      assert.deepEqual(original.getFont(), clone.getFont());
      assert.deepEqual(original.getOffsetX(), clone.getOffsetX());
      assert.deepEqual(original.getOffsetY(), clone.getOffsetY());
      assert.deepEqual(original.getScale(), clone.getScale());
      assert.deepEqual(original.getRotateWithView(), clone.getRotateWithView());
      assert.deepEqual(original.getRotation(), clone.getRotation());
      assert.deepEqual(original.getText(), clone.getText());
      assert.deepEqual(original.getTextAlign(), clone.getTextAlign());
      assert.deepEqual(original.getRepeat(), clone.getRepeat());
      assert.deepEqual(original.getTextBaseline(), clone.getTextBaseline());
      assert.deepEqual(
        original.getStroke().getColor(),
        clone.getStroke().getColor(),
      );
      assert.deepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.deepEqual(
        original.getBackgroundStroke().getColor(),
        clone.getBackgroundStroke().getColor(),
      );
      assert.deepEqual(
        original.getBackgroundFill().getColor(),
        clone.getBackgroundFill().getColor(),
      );
      assert.deepEqual(original.getPadding(), clone.getPadding());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Text({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
      });
      const clone = original.clone();
      assert.notEqual(original.getFill(), clone.getFill());
      assert.notEqual(original.getStroke(), clone.getStroke());

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

  describe('#setRotateWithView', function () {
    it('sets the rotateWithView property', function () {
      const textStyle = new Text();
      assert.deepEqual(textStyle.getRotateWithView(), undefined);
      textStyle.setRotateWithView(true);
      assert.deepEqual(textStyle.getRotateWithView(), true);
    });
  });
});
