goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.Stamen');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


function createStyle(src, img) {
  return new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 0.96],
      src: src,
      img: img,
      imgSize: img ? [img.width, img.height] : undefined
    }))
  });
}

var iconFeature = new ol.Feature(new ol.geom.Point([0, 0]));
iconFeature.set('style', createStyle('data/icon.png', undefined));

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.Stamen({layer: 'watercolor'})
    }),
    new ol.layer.Vector({
      style: function(feature) {
        return feature.get('style');
      },
      source: new ol.source.Vector({features: [iconFeature]})
    })
  ],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 3
  })
});

var selectStyle = {};
var select = new ol.interaction.Select({
  style: function(feature) {
    var image = feature.get('style').getImage().getImage();
    if (!selectStyle[image.src]) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      for (var i = 0, ii = data.length; i < ii; i = i + (i % 4 == 2 ? 2 : 1)) {
        data[i] = 255 - data[i];
      }
      context.putImageData(imageData, 0, 0);
      selectStyle[image.src] = createStyle(undefined, canvas);
    }
    return selectStyle[image.src];
  }
});
map.addInteraction(select);

map.on('pointermove', function(evt) {
  map.getTargetElement().style.cursor =
      map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
});
