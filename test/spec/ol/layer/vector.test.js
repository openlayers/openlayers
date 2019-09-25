import Layer from '../../../../src/ol/layer/Layer.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Style, {createDefaultStyle} from '../../../../src/ol/style/Style.js';


describe('ol.layer.Vector', () => {

  describe('constructor', () => {
    const source = new VectorSource();
    const style = new Style();

    test('creates a new layer', () => {
      const layer = new VectorLayer({source: source});
      expect(layer).toBeInstanceOf(VectorLayer);
      expect(layer).toBeInstanceOf(Layer);
    });

    test('accepts a style option with a single style', () => {
      const layer = new VectorLayer({
        source: source,
        style: style
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).toEqual([style]);
    });

    test('accepts a style option with an array of styles', () => {
      const layer = new VectorLayer({
        source: source,
        style: [style]
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).toEqual([style]);
    });

    test('accepts a style option with a style function', () => {
      const layer = new VectorLayer({
        source: source,
        style: function(feature, resolution) {
          return [style];
        }
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).toEqual([style]);
    });

  });

  describe('#setStyle()', () => {

    let layer, style;

    beforeEach(() => {
      layer = new VectorLayer({
        source: new VectorSource()
      });
      style = new Style();
    });

    test('allows the style to be set after construction', () => {
      layer.setStyle(style);
      expect(layer.getStyle()).toBe(style);
    });

    test('dispatches the change event', done => {
      layer.on('change', function() {
        done();
      });
      layer.setStyle(style);
    });

    test('updates the internal style function', () => {
      expect(layer.getStyleFunction()).toBe(createDefaultStyle);
      layer.setStyle(style);
      expect(layer.getStyleFunction()).not.toBe(createDefaultStyle);
    });

    test('allows setting an null style', () => {
      layer.setStyle(null);
      expect(layer.getStyle()).toBe(null);
      expect(layer.getStyleFunction()).toBe(undefined);
    });

    test('sets the default style when passing undefined', () => {
      layer.setStyle(style);
      layer.setStyle(undefined);
      expect(layer.getStyle()).toBe(createDefaultStyle);
      expect(layer.getStyleFunction()).toBe(createDefaultStyle);
    });

  });

  describe('#getStyle()', () => {

    const source = new VectorSource();
    const style = new Style();

    test('returns what is provided to setStyle', () => {
      const layer = new VectorLayer({
        source: source
      });

      expect(layer.getStyle()).toBe(createDefaultStyle);

      layer.setStyle(style);
      expect(layer.getStyle()).toBe(style);

      layer.setStyle([style]);
      expect(layer.getStyle()).toEqual([style]);

      const styleFunction = function(feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      expect(layer.getStyle()).toBe(styleFunction);

    });

  });

});
