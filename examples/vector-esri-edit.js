import EsriJSON from '../src/ol/format/EsriJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {
  Draw,
  Modify,
  Select,
  defaults as defaultInteractions,
} from '../src/ol/interaction.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {createXYZ} from '../src/ol/tilegrid.js';
import {fromLonLat} from '../src/ol/proj.js';
import {tile as tileStrategy} from '../src/ol/loadingstrategy.js';

const serviceUrl =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/';
const layer = '2';

const esrijsonFormat = new EsriJSON();

const vectorSource = new VectorSource({
  loader: function (extent, resolution, projection) {
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
        } else {
          // dataProjection will be read from document
          const features = esrijsonFormat.readFeatures(response, {
            featureProjection: projection,
          });
          if (features.length > 0) {
            vectorSource.addFeatures(features);
          }
        }
      },
    });
  },
  strategy: tileStrategy(
    createXYZ({
      tileSize: 512,
    })
  ),
});

const vector = new VectorLayer({
  source: vectorSource,
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

const draw = new Draw({
  source: vectorSource,
  type: 'Polygon',
});

const select = new Select();
select.setActive(false);
const selected = select.getFeatures();

const modify = new Modify({
  features: selected,
});
modify.setActive(false);

const map = new Map({
  interactions: defaultInteractions().extend([draw, select, modify]),
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([-110.875, 37.345]),
    zoom: 5,
  }),
});

const typeSelect = document.getElementById('type');

/**
 * Let user change the interaction type.
 */
typeSelect.onchange = function () {
  draw.setActive(typeSelect.value === 'DRAW');
  select.setActive(typeSelect.value === 'MODIFY');
  modify.setActive(typeSelect.value === 'MODIFY');
};

const dirty = {};

selected.on('add', function (evt) {
  const feature = evt.element;
  feature.on('change', function (evt) {
    dirty[evt.target.get('objectid')] = true;
  });
});

selected.on('remove', function (evt) {
  const feature = evt.element;
  const fid = feature.get('objectid');
  if (dirty[fid] === true) {
    const payload =
      '[' +
      esrijsonFormat.writeFeature(feature, {
        featureProjection: map.getView().getProjection(),
      }) +
      ']';
    const url = serviceUrl + layer + '/updateFeatures';
    $.post(url, {f: 'json', features: payload}).done(function (data) {
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result.updateResults && result.updateResults.length > 0) {
        if (result.updateResults[0].success !== true) {
          const error = result.updateResults[0].error;
          alert(error.description + ' (' + error.code + ')');
        } else {
          delete dirty[fid];
        }
      }
    });
  }
});

draw.on('drawend', function (evt) {
  const feature = evt.feature;
  const payload =
    '[' +
    esrijsonFormat.writeFeature(feature, {
      featureProjection: map.getView().getProjection(),
    }) +
    ']';
  const url = serviceUrl + layer + '/addFeatures';
  $.post(url, {f: 'json', features: payload}).done(function (data) {
    const result = typeof data === 'string' ? JSON.parse(data) : data;
    if (result.addResults && result.addResults.length > 0) {
      if (result.addResults[0].success === true) {
        feature.set('objectid', result.addResults[0]['objectId']);
      } else {
        const error = result.addResults[0].error;
        alert(error.description + ' (' + error.code + ')');
      }
    }
  });
});
