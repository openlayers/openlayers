goog.provide('ol.test.geom.Geometry');

describe('ol.geom.Geometry', function() {

  describe('constructor', function() {
    it('creates a new geometry', function() {
      var geom = new ol.geom.Geometry();
      expect(geom).to.be.a(ol.geom.Geometry);
      expect(geom).to.be.a(goog.events.EventTarget);
    });
  });

});

describe('ol.geom.GeometryEvent', function() {

  describe('constructor', function() {

    it('creates a new event', function() {
      var point = new ol.geom.Point([1, 2]);
      var bounds = point.getBounds();
      var evt = new ol.geom.GeometryEvent('change', point, bounds);
      expect(evt).to.be.a(ol.geom.GeometryEvent);
      expect(evt).to.be.a(goog.events.Event);
      expect(evt.target).to.be(point);
      expect(evt.oldExtent).to.be(bounds);
    });

  });

});

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryEvent');
goog.require('ol.geom.Point');
