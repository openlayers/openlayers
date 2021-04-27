import Feature from '../../../../../src/ol/Feature.js';
import ImageStyle from '../../../../../src/ol/style/Image.js';
import Layer from '../../../../../src/ol/layer/Layer.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Map from '../../../../../src/ol/Map.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style, {createDefaultStyle} from '../../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';

describe('ol.layer.Vector', function () {
  describe('constructor', function () {
    const source = new VectorSource();
    const style = new Style();

    it('creates a new layer', function () {
      const layer = new VectorLayer({source: source});
      expect(layer).to.be.a(VectorLayer);
      expect(layer).to.be.a(Layer);
    });

    it('accepts a style option with a single style', function () {
      const layer = new VectorLayer({
        source: source,
        style: style,
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with an array of styles', function () {
      const layer = new VectorLayer({
        source: source,
        style: [style],
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });

    it('accepts a style option with a style function', function () {
      const layer = new VectorLayer({
        source: source,
        style: function (feature, resolution) {
          return [style];
        },
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction()).to.eql([style]);
    });
  });

  describe('#setStyle()', function () {
    let layer, style;

    beforeEach(function () {
      layer = new VectorLayer({
        source: new VectorSource(),
      });
      style = new Style();
    });

    it('allows the style to be set after construction', function () {
      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);
    });

    it('dispatches the change event', function (done) {
      layer.on('change', function () {
        done();
      });
      layer.setStyle(style);
    });

    it('updates the internal style function', function () {
      expect(layer.getStyleFunction()).to.be(createDefaultStyle);
      layer.setStyle(style);
      expect(layer.getStyleFunction()).not.to.be(createDefaultStyle);
    });

    it('allows setting an null style', function () {
      layer.setStyle(null);
      expect(layer.getStyle()).to.be(null);
      expect(layer.getStyleFunction()).to.be(undefined);
    });

    it('sets the default style when passing undefined', function () {
      layer.setStyle(style);
      layer.setStyle(undefined);
      expect(layer.getStyle()).to.be(createDefaultStyle);
      expect(layer.getStyleFunction()).to.be(createDefaultStyle);
    });
  });

  describe('#getStyle()', function () {
    const source = new VectorSource();
    const style = new Style();

    it('returns what is provided to setStyle', function () {
      const layer = new VectorLayer({
        source: source,
      });

      expect(layer.getStyle()).to.be(createDefaultStyle);

      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);

      layer.setStyle([style]);
      expect(layer.getStyle()).to.eql([style]);

      const styleFunction = function (feature, resolution) {
        return [style];
      };
      layer.setStyle(styleFunction);
      expect(layer.getStyle()).to.be(styleFunction);
    });
  });

  describe('#getFeatures()', function () {
    let map;
    beforeEach(function () {
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        view: new View({
          zoom: 2,
          center: [0, 0],
        }),
      });
    });

    afterEach(function () {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('detects features properly', function (done) {
      const source = new VectorSource({
        features: [
          new Feature({
            geometry: new Point([-1000000, 0]),
            name: 'feature1',
          }),
          new Feature({
            geometry: new Point([1000000, 0]),
            name: 'feature2',
          }),
        ],
      });

      const feature = new Feature({
        geometry: new Point([-1000000, 0]),
        name: 'feature with no size',
      });

      const testImage = new ImageStyle({
        opacity: 1,
        displacement: [],
      });

      testImage.getImageState = () => {};
      testImage.listenImageChange = () => {};
      testImage.getImageSize = () => {};

      feature.setStyle([
        new Style({
          image: testImage,
        }),
      ]);

      source.addFeature(feature);

      const layer = new VectorLayer({
        source,
      });
      map.addLayer(layer);
      map.renderSync();

      const pixel = map.getPixelFromCoordinate([-1000000, 0]);

      layer.getFeatures(pixel).then(function (features) {
        expect(features.length).to.equal(1);
        expect(features[0].get('name')).to.be('feature1');
        done();
      });
    });

    it('hits lines even if they are dashed', function (done) {
      const geometry = new LineString([
        [-1e6, 0],
        [1e6, 0],
      ]);
      const feature = new Feature(geometry);
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: new Style({
          stroke: new Stroke({
            color: 'black',
            width: 8,
            lineDash: [10, 20],
          }),
        }),
      });
      map.addLayer(layer);
      map.renderSync();

      const pixel = map.getPixelFromCoordinate([0, 0]);

      layer
        .getFeatures(pixel)
        .then(function (features) {
          expect(features.length).to.equal(1);
          expect(features[0]).to.be(feature);
          done();
        }, done)
        .catch(done);
    });
  });
});
