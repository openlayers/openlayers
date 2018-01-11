import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import Select from '../src/ol/interaction/Select.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import Stamen from '../src/ol/source/Stamen.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


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

var iconFeature = new Feature(new Point([0, 0]));
iconFeature.set('style', createStyle('data/icon.png', undefined));

var map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({layer: 'watercolor'})
    }),
    new VectorLayer({
      style: function(feature) {
        return feature.get('style');
      },
      source: new VectorSource({features: [iconFeature]})
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 3
  })
});

var selectStyle = {};
var select = new Select({
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
