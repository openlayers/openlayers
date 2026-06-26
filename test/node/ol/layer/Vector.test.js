import {assert} from 'chai';
import Vector from '../../../../src/ol/layer/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style, {createDefaultStyle} from '../../../../src/ol/style/Style.js';

describe('ol/layer/Vector.js', () => {
  describe('getStyle()', () => {
    it('returns the default style if no style was set', () => {
      const layer = new Vector();
      assert.strictEqual(layer.getStyle(), createDefaultStyle);
    });
    it('returns null if null was set', () => {
      const layer = new Vector();
      layer.setStyle(null);
      assert.strictEqual(layer.getStyle(), null);
    });
    it('returns a Style if a Style was set', () => {
      const layer = new Vector();
      const style = new Style({
        fill: new Fill({
          color: 'red',
        }),
      });
      layer.setStyle(style);
      assert.strictEqual(layer.getStyle(), style);
    });
  });
});
