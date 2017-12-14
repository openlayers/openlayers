import {getUid} from '../../../../../src/ol/index.js';
import _ol_Feature_ from '../../../../../src/ol/Feature.js';
import _ol_Map_ from '../../../../../src/ol/Map.js';
import _ol_View_ from '../../../../../src/ol/View.js';
import * as _ol_extent_ from '../../../../../src/ol/extent.js';
import Point from '../../../../../src/ol/geom/Point.js';
import _ol_layer_Vector_ from '../../../../../src/ol/layer/Vector.js';
import _ol_obj_ from '../../../../../src/ol/obj.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import _ol_render_canvas_ from '../../../../../src/ol/render/canvas.js';
import _ol_renderer_canvas_VectorLayer_ from '../../../../../src/ol/renderer/canvas/VectorLayer.js';
import _ol_source_Vector_ from '../../../../../src/ol/source/Vector.js';
import _ol_style_Style_ from '../../../../../src/ol/style/Style.js';
import _ol_style_Text_ from '../../../../../src/ol/style/Text.js';


describe('ol.renderer.canvas.VectorLayer', function() {

  describe('constructor', function() {

    var head = document.getElementsByTagName('head')[0];
    var font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Droid+Sans';
    font.rel = 'stylesheet';

    var target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function() {
      document.body.removeChild(target);
    });

    it('creates a new instance', function() {
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_()
      });
      var renderer = new _ol_renderer_canvas_VectorLayer_(layer);
      expect(renderer).to.be.a(_ol_renderer_canvas_VectorLayer_);
    });

    it('gives precedence to feature styles over layer styles', function() {
      var target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      var map = new _ol_Map_({
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      var layerStyle = [new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'layer'
        })
      })];
      var featureStyle = [new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'feature'
        })
      })];
      var feature1 = new _ol_Feature_(new Point([0, 0]));
      var feature2 = new _ol_Feature_(new Point([0, 0]));
      feature2.setStyle(featureStyle);
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [feature1, feature2]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      var spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
          'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[3]).to.be(layerStyle);
      expect(spy.getCall(1).args[3]).to.be(featureStyle);
      document.body.removeChild(target);
    });

    it('does not re-render for unavailable fonts', function(done) {
      _ol_obj_.clear(_ol_render_canvas_.checkedFonts_);
      var map = new _ol_Map_({
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      var layerStyle = new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'layer',
          font: '12px "Unavailable Font",sans-serif'
        })
      });

      var feature = new _ol_Feature_(new Point([0, 0]));
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      var revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('does not re-render for available fonts', function(done) {
      _ol_obj_.clear(_ol_render_canvas_.checkedFonts_);
      var map = new _ol_Map_({
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      var layerStyle = new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'layer',
          font: '12px sans-serif'
        })
      });

      var feature = new _ol_Feature_(new Point([0, 0]));
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      var revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('re-renders for fonts that become available', function(done) {
      _ol_obj_.clear(_ol_render_canvas_.checkedFonts_);
      head.appendChild(font);
      var map = new _ol_Map_({
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      var layerStyle = new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'layer',
          font: '12px "Droid Sans",sans-serif'
        })
      });

      var feature = new _ol_Feature_(new Point([0, 0]));
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      var revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision + 1);
        head.removeChild(font);
        done();
      }, 1600);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {
    var layer, renderer;

    beforeEach(function() {
      layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_()
      });
      renderer = new _ol_renderer_canvas_VectorLayer_(layer);
      var replayGroup = {};
      renderer.replayGroup_ = replayGroup;
      replayGroup.forEachFeatureAtCoordinate = function(coordinate,
          resolution, rotation, hitTolerance, skippedFeaturesUids, callback) {
        var feature = new _ol_Feature_();
        callback(feature);
        callback(feature);
      };
    });

    it('calls callback once per feature with a layer as 2nd arg', function() {
      var spy = sinon.spy();
      var coordinate = [0, 0];
      var frameState = {
        layerStates: {},
        skippedFeatureUids: {},
        viewState: {
          resolution: 1,
          rotation: 0
        }
      };
      frameState.layerStates[getUid(layer)] = {};
      renderer.forEachFeatureAtCoordinate(
          coordinate, frameState, 0, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });
  });

  describe('#prepareFrame', function() {
    var frameState, projExtent, renderer, worldWidth, buffer;

    beforeEach(function() {
      var layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({wrapX: true})
      });
      renderer = new _ol_renderer_canvas_VectorLayer_(layer);
      var projection = getProjection('EPSG:3857');
      projExtent = projection.getExtent();
      worldWidth = _ol_extent_.getWidth(projExtent);
      buffer = layer.getRenderBuffer();
      frameState = {
        skippedFeatureUids: {},
        viewHints: [],
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0
        }
      };
    });

    it('sets correct extent for small viewport near dateline', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(_ol_extent_.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));

    });

    it('sets correct extent for viewport less than 1 world wide', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[1] - 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(_ol_extent_.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 1 world wide', function() {

      frameState.extent =
          [2 * projExtent[0] - 10000, -10000, 2 * projExtent[1] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(_ol_extent_.buffer([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 2 worlds wide', function() {

      frameState.extent = [
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[1] + 2 * worldWidth + 10000, 10000
      ];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(_ol_extent_.buffer([
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[2] + 2 * worldWidth + 10000, 10000
      ], buffer));
    });

    it('sets replayGroupChanged correctly', function() {
      frameState.extent = [-10000, -10000, 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroupChanged).to.be(true);
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroupChanged).to.be(false);
    });

  });

});
