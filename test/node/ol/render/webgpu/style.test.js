import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import {compileStyle} from '../../../../../src/ol/render/webgpu/style.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol/render/webgpu/style.js', () => {
  describe('compileStyle()', () => {
    it('evaluates zoom expressions with the zoom it is called with', () => {
      const styleFunction = compileStyle({
        'stroke-color': [255, 0, 0, 1],
        'stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 12, 5],
      });
      const style =
        /** @type {import("../../../../../src/ol/style/Style.js").default} */ (
          styleFunction(new Feature(), 1, 11)
        );
      assert.strictEqual(style.getStroke().getWidth(), 3);
    });

    it('draws nothing without a style', () => {
      assert.isUndefined(compileStyle(undefined)(new Feature(), 1, 11));
    });

    it('calls a style function without the zoom level', () => {
      let args;
      compileStyle((...rest) => {
        args = rest;
      })(new Feature(), 1, 11);
      assert.lengthOf(args, 2);
    });

    it('wraps a Style and a Style array', () => {
      const style = new Style({fill: new Fill({color: 'red'})});
      assert.deepEqual(compileStyle(style)(new Feature(), 1, 0), [style]);
      assert.deepEqual(compileStyle([style, style])(new Feature(), 1, 0), [
        style,
        style,
      ]);
    });
  });
});
