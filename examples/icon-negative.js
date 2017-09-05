import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_interaction_Select_ from '../src/ol/interaction/select';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Stamen_ from '../src/ol/source/stamen';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Icon_ from '../src/ol/style/icon';
import _ol_style_Style_ from '../src/ol/style/style';


function createStyle(src, img) {
  return new _ol_style_Style_({
    image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 0.96],
      crossOrigin: 'anonymous',
      src: src,
      img: img,
      imgSize: img ? [img.width, img.height] : undefined
    }))
  });
}

var iconFeature = new _ol_Feature_(new _ol_geom_Point_([0, 0]));
iconFeature.set('style', createStyle('data/icon.png', undefined));

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_Stamen_({layer: 'watercolor'})
    }),
    new _ol_layer_Vector_({
      style: function(feature) {
        return feature.get('style');
      },
      source: new _ol_source_Vector_({features: [iconFeature]})
    })
  ],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 3
  })
});

var selectStyle = {};
var select = new _ol_interaction_Select_({
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
