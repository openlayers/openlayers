goog.require('ol.format.WMSGetFeatureInfo');

fetch('data/wmsgetfeatureinfo/osm-restaurant-hotel.xml').then(function(response) {
  return response.text();
}).then(function(response) {

  // this is the standard way to read the features
  var allFeatures = new ol.format.WMSGetFeatureInfo().readFeatures(response);
  document.getElementById('all').innerText = allFeatures.length.toString();

  // when specifying the 'layers' options, only the features of those
  // layers are returned by the format
  var hotelFeatures = new ol.format.WMSGetFeatureInfo({
    layers: ['hotel']
  }).readFeatures(response);
  document.getElementById('hotel').innerText = hotelFeatures.length.toString();

  var restaurantFeatures = new ol.format.WMSGetFeatureInfo({
    layers: ['restaurant']
  }).readFeatures(response);
  document.getElementById('restaurant').innerText = restaurantFeatures.length.toString();

});
