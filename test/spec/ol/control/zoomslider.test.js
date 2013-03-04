goog.provide('ol.test.control.ZoomSlider');

describe('ol.control.ZoomSlider', function() {
  var map, zoomslider;

//  beforeEach(function() {
//    map = new ol.Map({
//      target: document.getElementById('map')
//    });
//    var element = goog.dom.createDom(goog.dom.TagName.DIV);
//    zoomslider = new ol.control.ZoomSlider({
//      minResolution: 5000,
//      maxResolution: 100000
//    });
//    zoomslider.setMap(map);
//  });
//
//  afterEach(function() {
//    map.dispose();
//  });

  describe('configuration & defaults', function() {
    it('has valid defaults for min and maxresolution', function(){
        expect(function(){
          var zoomslider = new ol.control.ZoomSlider({});
        }).not.toThrow();
    });
      
    it('throws exception when configured with wrong resolutions', function() {
      expect(function(){
        var zoomslider = new ol.control.ZoomSlider({
          minResolution: 50,
          maxResolution: 0
        });
      }).toThrow();
    });
    
    
  });
});

goog.require('goog.dom');
goog.require('ol.Map');
goog.require('ol.control.ZoomSlider');
