goog.provide('ol.test.interaction.Snap');

goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.interaction.Snap');


describe('ol.interaction.Snap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.Snap();
      expect(instance).to.be.an(ol.interaction.Snap);
    });

  });

  describe('handleEvent_', function() {
    var target, map;

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

      map = new ol.Map({
        target: target,
        view: new ol.View({
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

    it('can handle XYZ coordinates', function() {
      var point = new ol.Feature(new ol.geom.Point([0, 0, 123]));
      var snapInteraction = new ol.interaction.Snap({
        features: new ol.Collection([point])
      });
      snapInteraction.setMap(map);

      var event = {
        pixel: [width / 2, height / 2],
        coordinate: [0, 0],
        map: map
      };
      ol.interaction.Snap.handleEvent_.call(snapInteraction, event);
      // check that the coordinate is in XY and not XYZ
      expect(event.coordinate).to.eql([0, 0]);
    });

    it('snaps to edges only', function() {
      var point = new ol.Feature(new ol.geom.LineString([[-10, 0], [10, 0]]));
      var snapInteraction = new ol.interaction.Snap({
        features: new ol.Collection([point]),
        pixelTolerance: 5,
        vertex: false
      });
      snapInteraction.setMap(map);

      var event = {
        pixel: [7 + width / 2,  height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      ol.interaction.Snap.handleEvent_.call(snapInteraction, event);
      expect(event.coordinate).to.eql([7, 0]);
    });

    it('snaps to vertices only', function() {
      var point = new ol.Feature(new ol.geom.LineString([[-10, 0], [10, 0]]));
      var snapInteraction = new ol.interaction.Snap({
        features: new ol.Collection([point]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      var event = {
        pixel: [7 + width / 2,  height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      ol.interaction.Snap.handleEvent_.call(snapInteraction, event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('handle feature without geometry', function() {
      var feature = new ol.Feature();
      var snapInteraction = new ol.interaction.Snap({
        features: new ol.Collection([feature]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      feature.setGeometry(new ol.geom.LineString([[-10, 0], [10, 0]]));

      var event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coorinate: [7, 4],
        map: map
      };
      ol.interaction.Snap.handleEvent_.call(snapInteraction, event);
      expect(event.coordinate).to.eql([10, 0]);
    });

  });

});
