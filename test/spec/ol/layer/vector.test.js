import Layer from '../../../../src/ol/layer/Layer.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Style, {createDefaultStyle} from '../../../../src/ol/style/Style.js';
import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';


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

  describe('#getFeatures()', function() {

    let map, layer;

    beforeEach(function() {
      layer = new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point([-1000000, 0]),
              name: 'feature1'
            }),
            new Feature({
              geometry: new Point([1000000, 0]),
              name: 'feture2'
            })
          ]
        })
      });
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        layers: [
          layer
        ],
        view: new View({
          zoom: 2,
          center: [0, 0]
        })
      });
    });

    afterEach(function() {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('detects features properly', function(done) {
      map.renderSync();
      const pixel = map.getPixelFromCoordinate([-1000000, 0]);
      layer.getFeatures(pixel).then(function(features) {
        expect(features[0].get('name')).to.be('feature1');
        done();
      });
    });

  });

});
