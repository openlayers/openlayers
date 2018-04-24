import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from '../src/ol/format.js';
import {defaults as defaultInteractions, DragAndDrop} from '../src/ol/interaction.js';
import {Vector as VectorLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {BingMaps, Vector as VectorSource} from '../src/ol/source.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from '../src/ol/style.js';


const defaultStyle = {
  'Point': new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: 'rgba(255,255,0,0.5)'
      }),
      radius: 5,
      stroke: new Stroke({
        color: '#ff0',
        width: 1
      })
    })
  }),
  'LineString': new Style({
    stroke: new Stroke({
      color: '#f00',
      width: 3
    })
  }),
  'Polygon': new Style({
    fill: new Fill({
      color: 'rgba(0,255,255,0.5)'
    }),
    stroke: new Stroke({
      color: '#0ff',
      width: 1
    })
  }),
  'MultiPoint': new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: 'rgba(255,0,255,0.5)'
      }),
      radius: 5,
      stroke: new Stroke({
        color: '#f0f',
        width: 1
      })
    })
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({
      color: '#0f0',
      width: 3
    })
  }),
  'MultiPolygon': new Style({
    fill: new Fill({
      color: 'rgba(0,0,255,0.5)'
    }),
    stroke: new Stroke({
      color: '#00f',
      width: 1
    })
  })
};

const styleFunction = function(feature, resolution) {
  const featureStyleFunction = feature.getStyleFunction();
  if (featureStyleFunction) {
    return featureStyleFunction.call(feature, resolution);
  } else {
    return defaultStyle[feature.getGeometry().getType()];
  }
};

const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [
    GPX,
    GeoJSON,
    IGC,
    KML,
    TopoJSON
  ]
});

const map = new Map({
  interactions: defaultInteractions().extend([dragAndDropInteraction]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        imagerySet: 'Aerial',
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

dragAndDropInteraction.on('addfeatures', function(event) {
  const vectorSource = new VectorSource({
    features: event.features
  });
  map.addLayer(new VectorLayer({
    renderMode: 'image',
    source: vectorSource,
    style: styleFunction
  }));
  map.getView().fit(vectorSource.getExtent());
});

const displayFeatureInfo = function(pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function(feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    const info = [];
    let i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('name'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
