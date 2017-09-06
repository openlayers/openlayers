

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_extent_ from '../../../../src/ol/extent';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_interaction_DragZoom_ from '../../../../src/ol/interaction/dragzoom';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_render_Box_ from '../../../../src/ol/render/box';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';


describe('ol.interaction.DragZoom', function() {

  var target, map, source;

  var width = 360;
  var height = 180;

  beforeEach(function(done) {
    target = document.createElement('div');
    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    source = new _ol_source_Vector_();
    var layer = new _ol_layer_Vector_({source: source});
    map = new _ol_Map_({
      target: target,
      layers: [layer],
      view: new _ol_View_({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new _ol_interaction_DragZoom_();
      expect(instance).to.be.an(_ol_interaction_DragZoom_);
    });
    it('sets "ol-dragzoom" as box className', function() {
      var instance = new _ol_interaction_DragZoom_();
      expect(instance.box_.element_.className).to.be('ol-box ol-dragzoom');
    });
    it('sets a custom box className', function() {
      var instance = new _ol_interaction_DragZoom_({className: 'test-dragzoom'});
      expect(instance.box_.element_.className).to.be('ol-box test-dragzoom');
    });

  });

  describe('#onBoxEnd()', function() {

    it('centers the view on the box geometry', function(done) {
      var interaction = new _ol_interaction_DragZoom_({
        duration: 10
      });
      map.addInteraction(interaction);

      var box = new _ol_render_Box_();
      var extent = [-110, 40, -90, 60];
      box.geometry_ = _ol_geom_Polygon_.fromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();
      setTimeout(function() {
        var view = map.getView();
        var center = view.getCenter();
        expect(center).to.eql(_ol_extent_.getCenter(extent));
        done();
      }, 50);

    });

    it('sets new resolution while zooming out', function(done) {
      var interaction = new _ol_interaction_DragZoom_({
        duration: 10,
        out: true
      });
      map.addInteraction(interaction);

      var box = new _ol_render_Box_();
      var extent = [-11.25, -11.25, 11.25, 11.25];
      box.geometry_ = _ol_geom_Polygon_.fromExtent(extent);
      interaction.box_ = box;

      map.getView().setResolution(0.25);
      setTimeout(function() {
        interaction.onBoxEnd();
        setTimeout(function() {
          var view = map.getView();
          var resolution = view.getResolution();
          expect(resolution).to.eql(view.constrainResolution(0.5));
          done();
        }, 50);
      }, 50);

    });

  });


});
