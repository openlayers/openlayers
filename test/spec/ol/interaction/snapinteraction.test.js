goog.provide('ol.test.interaction.Snap');

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
      goog.dispose(map);
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

  });

});

goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Snap');
