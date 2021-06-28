import WMSGetFeatureInfo from '../src/ol/format/WMSGetFeatureInfo.js';

fetch('data/wmsgetfeatureinfo/osm-restaurant-hotel.xml')
  .then(function (response) {
    return response.text();
  })
  .then(function (response) {
    // this is the standard way to read the features
    const allFeatures = new WMSGetFeatureInfo().readFeatures(response);
    document.getElementById('all').innerText = allFeatures.length.toString();

    // when specifying the 'layers' options, only the features of those
    // layers are returned by the format
    const hotelFeatures = new WMSGetFeatureInfo({
      layers: ['hotel'],
    }).readFeatures(response);
    document.getElementById('hotel').innerText =
      hotelFeatures.length.toString();

    const restaurantFeatures = new WMSGetFeatureInfo({
      layers: ['restaurant'],
    }).readFeatures(response);
    document.getElementById('restaurant').innerText =
      restaurantFeatures.length.toString();
  });
