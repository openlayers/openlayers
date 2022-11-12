import EsriJSON from '../src/ol/format/EsriJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {asString} from '../src/ol/color.js';
import {createXYZ} from '../src/ol/tilegrid.js';
import {fromLonLat} from '../src/ol/proj.js';
import {tile as tileStrategy} from '../src/ol/loadingstrategy.js';

const serviceUrl =
  'https://services-eu1.arcgis.com/NPIbx47lsIiu2pqz/ArcGIS/rest/services/' +
  'Neptune_Coastline_Campaign_Open_Data_Land_Use_2014/FeatureServer/';
const layer = '0';

const vectorSource = new VectorSource({
  format: new EsriJSON(),
  url: function (extent, resolution, projection) {
    // ArcGIS Server only wants the numeric portion of the projection ID.
    const srid = projection
      .getCode()
      .split(/:(?=\d+$)/)
      .pop();

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
          ',"spatialReference":{"wkid":' +
          srid +
          '}}'
      ) +
      '&geometryType=esriGeometryEnvelope&inSR=' +
      srid +
      '&outFields=*' +
      '&outSR=' +
      srid;

    return url;
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
});

// Create an OpenLayers style cache for fill and outline
// from the Arcgis layer's Drawing Info
fetch(serviceUrl + layer + '?f=json')
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    if (json.drawingInfo.renderer.uniqueValueInfos) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Patterns are in canvas pixel space, so we adjust for the
      // renderer's pixel ratio
      const pixelRatio = DEVICE_PIXEL_RATIO;

      const toColor = function (color, style) {
        const rgba = asString(
          color.map(function (value, index) {
            return index < 3 ? value : value / 255;
          })
        );
        const pattern =
          style === 'esriSFSCross'
            ? [0, 0.5, 1, 0.5, 0.5, 0, 0.5, 1]
            : style === 'esriSFSDiagonalCross'
            ? [0, 0, 1, 1, 0, 1, 1, 0]
            : style === 'esriSFSBackwardDiagonal'
            ? [0, 1, 1, 0]
            : style === 'esriSFSForwardDiagonal'
            ? [0, 0, 1, 1]
            : style === 'esriSFSHorizontal'
            ? [0, 0.5, 1, 0.5]
            : style === 'esriSFSVertical'
            ? [0.5, 0, 0.5, 1]
            : null;
        if (!pattern) {
          return rgba;
        }
        canvas.width = 16 * pixelRatio;
        canvas.height = 16 * pixelRatio;
        context.lineWidth = 2 * pixelRatio;
        context.strokeStyle = rgba;
        for (let i = 0; i < pattern.length; i += 4) {
          context.moveTo(
            pattern[i] * canvas.width,
            pattern[i + 1] * canvas.height
          );
          context.lineTo(
            pattern[i + 2] * canvas.width,
            pattern[i + 3] * canvas.height
          );
        }
        context.stroke();
        return context.createPattern(canvas, 'repeat');
      };

      const styleCache = {};
      json.drawingInfo.renderer.uniqueValueInfos.forEach(function (info) {
        styleCache[info.value] = new Style({
          fill: new Fill({
            color: toColor(info.symbol.color, info.symbol.style),
          }),
          stroke: new Stroke({
            color: toColor(info.symbol.outline.color),
            width: info.symbol.outline.width,
          }),
        });
      });
      vector.setStyle(function (feature) {
        const classify = feature.get(json.drawingInfo.renderer.field1);
        return styleCache[classify];
      });
      vector.setOpacity(1 - json.drawingInfo.transparency / 100);
    }
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
    zoom: 14,
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

map.on(['click', 'pointermove'], function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});
