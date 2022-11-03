import EsriJSON from '../src/ol/format/EsriJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {createXYZ} from '../src/ol/tilegrid.js';
import {fromLonLat} from '../src/ol/proj.js';
import {tile as tileStrategy} from '../src/ol/loadingstrategy.js';

const serviceUrl =
  'https://services-eu1.arcgis.com/NPIbx47lsIiu2pqz/ArcGIS/rest/services/' +
  'Neptune_Coastline_Campaign_Open_Data_Land_Use_2014/FeatureServer/';
const layer = '0';

const esrijsonFormat = new EsriJSON();

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Patterns are in canvas pixel space, so we adjust for the
// renderer's pixel ratio
const pixelRatio = DEVICE_PIXEL_RATIO;

const backwardDiagonal = function (color) {
  canvas.width = 16 * pixelRatio;
  canvas.height = 16 * pixelRatio;
  context.lineWidth = 2 * pixelRatio;
  context.strokeStyle = color;
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.stroke();
  return context.createPattern(canvas, 'repeat');
};

const styleCache = {
  'Lost To Sea Since 1965': new Style({
    fill: new Fill({
      color: 'rgba(0, 0, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Urban/Built-up': new Style({
    fill: new Fill({
      color: 'rgba(104, 104, 104, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Shacks': new Style({
    fill: new Fill({
      color: 'rgba(115, 76, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0,
    }),
  }),
  'Industry': new Style({
    fill: new Fill({
      color: 'rgba(230, 0, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Wasteland': new Style({
    fill: new Fill({
      color: 'rgba(230, 0, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Caravans': new Style({
    fill: new Fill({
      color: backwardDiagonal('rgba(0, 112, 255, 1)'),
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Defence': new Style({
    fill: new Fill({
      color: backwardDiagonal('rgba(230, 152, 0, 1)'),
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Transport': new Style({
    fill: new Fill({
      color: 'rgba(230, 152, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Open Countryside': new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 115, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Woodland': new Style({
    fill: new Fill({
      color: 'rgba(38, 115, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Managed Recreation/Sport': new Style({
    fill: new Fill({
      color: 'rgba(85, 255, 0, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Amenity Water': new Style({
    fill: new Fill({
      color: 'rgba(0, 112, 255, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
  'Inland Water': new Style({
    fill: new Fill({
      color: 'rgba(0, 38, 115, 1)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      width: 0.4,
    }),
  }),
};

const vectorSource = new VectorSource({
  loader: function (extent, resolution, projection, success, failure) {
    const url =
      serviceUrl +
      layer +
      '/query/?f=json&' +
      'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
      encodeURIComponent(
        '{"xmin":' +
          extent[0] +
          ',"ymin":' +
          extent[1] +
          ',"xmax":' +
          extent[2] +
          ',"ymax":' +
          extent[3] +
          ',"spatialReference":{"wkid":102100}}'
      ) +
      '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' +
      '&outSR=102100';
    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function (response) {
        if (response.error) {
          alert(
            response.error.message + '\n' + response.error.details.join('\n')
          );
          failure();
        } else {
          // dataProjection will be read from document
          const features = esrijsonFormat.readFeatures(response, {
            featureProjection: projection,
          });
          if (features.length > 0) {
            vectorSource.addFeatures(features);
          }
          success(features);
        }
      },
      error: failure,
    });
  },
  strategy: tileStrategy(
    createXYZ({
      tileSize: 512,
    })
  ),
  attributions:
    'University of Leicester (commissioned by the ' +
    '<a href="https://www.arcgis.com/home/item.html?id=' +
    'd5f05b1dc3dd4d76906c421bc1727805">National Trust</a>)',
});

const vector = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    const classify = feature.get('LU_2014');
    return styleCache[classify];
  },
  opacity: 0.7,
});

const raster = new TileLayer({
  source: new XYZ({
    attributions:
      'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
      'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
    url:
      'https://server.arcgisonline.com/ArcGIS/rest/services/' +
      'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([1.72, 52.4]),
    zoom: 12,
  }),
});

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature) {
    const info =
      '2014 Land Use: ' +
      feature.get('LU_2014') +
      '<br>1965 Land Use: ' +
      feature.get('LU_1965');
    document.getElementById('info').innerHTML = info;
    map.getTarget().style.cursor = 'pointer';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;<br>&nbsp;';
    map.getTarget().style.cursor = '';
  }
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
