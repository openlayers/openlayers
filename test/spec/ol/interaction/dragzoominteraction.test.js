goog.provide('ol.test.interaction.DragZoom');

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
    source = new ol.source.Vector();
    var layer = new ol.layer.Vector({source: source});
    map = new ol.Map({
      target: target,
      layers: [layer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.on('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    goog.dispose(map);
    document.body.removeChild(target);
  });

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.DragZoom();
      expect(instance).to.be.an(ol.interaction.DragZoom);
    });
    it('sets "ol-dragzoom" as box className', function() {
      var instance = new ol.interaction.DragZoom();
      expect(instance.box_.element_.className).to.be('ol-box ol-dragzoom');
    });
    it('sets a custom box className', function() {
      var instance = new ol.interaction.DragZoom({className: 'test-dragzoom'});
      expect(instance.box_.element_.className).to.be('ol-box test-dragzoom');
    });

  });

  describe('#onBoxEnd()', function() {

    it('centers the view on the box geometry', function(done) {
      var interaction = new ol.interaction.DragZoom({
        duration: 10
      });
      map.addInteraction(interaction);

      var box = new ol.render.Box();
      var extent = [-110, 40, -90, 60];
      box.geometry_ = ol.geom.Polygon.fromExtent(extent);
      interaction.box_ = box;

      interaction.onBoxEnd();
      setTimeout(function() {
        var view = map.getView();
        var center = view.getCenter();
        expect(center).to.eql(ol.extent.getCenter(extent));
        done();
      }, 50);

    });

  });


});

goog.require('goog.dispose');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.DragZoom');
goog.require('ol.layer.Vector');
goog.require('ol.render.Box');
goog.require('ol.source.Vector');
