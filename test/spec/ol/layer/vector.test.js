import Layer from '../../../../src/ol/layer/Layer.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Style, {createDefaultStyle} from '../../../../src/ol/style/Style.js';


describe('ol.layer.Vector', function() {

  describe('constructor', function() {
    const source = new VectorSource();
    const style = new Style();

    it('creates a new layer', function() {
      const layer = new VectorLayer({source: source});
      expect(layer).to.be.a(VectorLayer);
      expect(layer).to.be.a(Layer);
    });

    it('accepts a style option with a single style', function() {
      const layer = new VectorLayer({
        source: source,
        style: style
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with an array of styles', function() {
      const layer = new VectorLayer({
        source: source,
        style: [style]
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with a style function', function() {
      const layer = new VectorLayer({
        source: source,
        style: function(feature, resolution) {
          return [style];
        }
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

  });

  describe('#setStyle()', function() {

    let layer, style;

    beforeEach(function() {
      layer = new VectorLayer({
        source: new VectorSource()
      });
      style = new Style();
    });

    it('allows the style to be set after construction', function() {
      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);
    });

    it('dispatches the change event', function(done) {
      layer.on('change', function() {
        done();
      });
      layer.setStyle(style);
    });

    it('updates the internal style function', function() {
      expect(layer.getStyleFunction()).to.be(createDefaultStyle);
      layer.setStyle(style);
      expect(layer.getStyleFunction()).not.to.be(
        createDefaultStyle);
    });

    it('allows setting an null style', function() {
      layer.setStyle(null);
      expect(layer.getStyle()).to.be(null);
      expect(layer.getStyleFunction()).to.be(undefined);
    });

    it('sets the default style when passing undefined', function() {
      layer.setStyle(style);
      layer.setStyle(undefined);
      expect(layer.getStyle()).to.be(createDefaultStyle);
      expect(layer.getStyleFunction()).to.be(createDefaultStyle);
    });

  });

  describe('#getStyle()', function() {

    const source = new VectorSource();
    const style = new Style();

    it('returns what is provided to setStyle', function() {
      const layer = new VectorLayer({
        source: source
      });

      expect(layer.getStyle()).to.be(createDefaultStyle);

      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);

      layer.setStyle([style]);
      expect(layer.getStyle()).to.eql([style]);

      const styleFunction = function(feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      expect(layer.getStyle()).to.be(styleFunction);

    });

  });

});
