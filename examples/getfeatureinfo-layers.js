goog.require('ol.format.WMSGetFeatureInfo');

$.ajax({
  url: './data/wmsgetfeatureinfo/osm-restaurant-hotel.xml',
  success: function(response) {

    // this is the standard way to read the features
    var allFeatures = new ol.format.WMSGetFeatureInfo().readFeatures(response);
    $('#all').html(allFeatures.length.toString());

    // when specifying the 'layers' options, only the features of those
    // layers are returned by the format
    var hotelFeatures = new ol.format.WMSGetFeatureInfo({
      layers: ['hotel']
    }).readFeatures(response);
    $('#hotel').html(hotelFeatures.length.toString());

    var restaurantFeatures = new ol.format.WMSGetFeatureInfo({
      layers: ['restaurant']
    }).readFeatures(response);
    $('#restaurant').html(restaurantFeatures.length.toString());

  }
});
