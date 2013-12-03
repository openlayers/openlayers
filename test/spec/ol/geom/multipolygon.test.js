goog.provide('ol.test.geom.MultiPolygon');


describe('ol.geom.MultiPolygon', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiPolygon = new ol.geom.MultiPolygon(null);
      multiPolygon = multiPolygon; // suppress gjslint warning
    }).not.to.throwException();
  });

});


goog.require('ol.geom.MultiPolygon');
