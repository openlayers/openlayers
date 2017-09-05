

import _ol_layer_Layer_ from '../../../../src/ol/layer/layer';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';
import _ol_style_Style_ from '../../../../src/ol/style/style';


describe('ol.layer.Vector', function() {

  describe('constructor', function() {
    var source = new _ol_source_Vector_();
    var style = new _ol_style_Style_();

    it('creates a new layer', function() {
      var layer = new _ol_layer_Vector_({source: source});
      expect(layer).to.be.a(_ol_layer_Vector_);
      expect(layer).to.be.a(_ol_layer_Layer_);
    });

    it('accepts a style option with a single style', function() {
      var layer = new _ol_layer_Vector_({
        source: source,
        style: style
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with an array of styles', function() {
      var layer = new _ol_layer_Vector_({
        source: source,
        style: [style]
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with a style function', function() {
      var layer = new _ol_layer_Vector_({
        source: source,
        style: function(feature, resolution) {
          return [style];
        }
      });

      var styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

  });

  describe('#setStyle()', function() {

    var layer, style;

    beforeEach(function() {
      layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_()
      });
      style = new _ol_style_Style_();
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
      expect(layer.getStyleFunction()).to.be(_ol_style_Style_.defaultFunction);
      layer.setStyle(style);
      expect(layer.getStyleFunction()).not.to.be(
          _ol_style_Style_.defaultFunction);
    });

    it('allows setting an null style', function() {
      layer.setStyle(null);
      expect(layer.getStyle()).to.be(null);
      expect(layer.getStyleFunction()).to.be(undefined);
    });

    it('sets the default style when passing undefined', function() {
      layer.setStyle(style);
      layer.setStyle(undefined);
      expect(layer.getStyle()).to.be(_ol_style_Style_.defaultFunction);
      expect(layer.getStyleFunction()).to.be(_ol_style_Style_.defaultFunction);
    });

  });

  describe('#getStyle()', function() {

    var source = new _ol_source_Vector_();
    var style = new _ol_style_Style_();

    it('returns what is provided to setStyle', function() {
      var layer = new _ol_layer_Vector_({
        source: source
      });

      expect(layer.getStyle()).to.be(_ol_style_Style_.defaultFunction);

      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);

      layer.setStyle([style]);
      expect(layer.getStyle()).to.eql([style]);

      var styleFunction = function(feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      expect(layer.getStyle()).to.be(styleFunction);

    });

  });

});
