import KML from '../src/ol/format/KML.js';
import Map from '../src/ol/Map.js';
import Stamen from '../src/ol/source/Stamen.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

/*
 * Compute the style of the feature.  Here we want the opacity of polygons to
 * be based on the offset from local noon.  For example, a timezone where it is
 * currently noon would have an opacity of 0.75.  And a timezone where it is
 * currently midnight would have an opacity of 0.  This doesn't account for
 * daylight savings, so don't use it to plan your vacation.
 */
const styleFunction = function (feature) {
  const tzOffset = feature.get('tz-offset');
  const local = new Date();
  local.setTime(
    local.getTime() + (local.getTimezoneOffset() + (tzOffset || 0)) * 60000
  );
  // offset from local noon (in hours)
  let delta = Math.abs(12 - (local.getHours() + local.getMinutes() / 60));
  if (delta > 12) {
    delta = 24 - delta;
  }
  const opacity = 0.75 * (1 - delta / 12);
  return new Style({
    fill: new Fill({
      color: [0xff, 0xff, 0x33, opacity],
    }),
    stroke: new Stroke({
      color: '#ffffff',
    }),
  });
};

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/timezones.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  style: styleFunction,
});

/**
 * @param {string} name e.g. GMT -08:30
 * @return {number|null} The offset from UTC in minutes
 */
function parseOffsetFromUtc(name) {
  const match = name.match(/([+-]?)(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (60 * hours + minutes);
}

vector.getSource().on('featuresloadend', function (evt) {
  evt.features.forEach(function (feature) {
    const tzOffset = parseOffsetFromUtc(feature.get('name'));
    feature.set('tz-offset', tzOffset, true);
  });
});

const raster = new TileLayer({
  source: new Stamen({
    layer: 'toner',
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const info = document.getElementById('info');
info.style.pointerEvents = 'none';
const tooltip = new bootstrap.Tooltip(info, {
  animation: false,
  customClass: 'pe-none',
  offset: [0, 5],
  title: '-',
  trigger: 'manual',
});

let currentFeature;
const displayFeatureInfo = function (pixel, target) {
  const feature = target.closest('.ol-control')
    ? undefined
    : map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
      });
  if (feature) {
    info.style.left = pixel[0] + 'px';
    info.style.top = pixel[1] + 'px';
    if (feature !== currentFeature) {
      tooltip.setContent({'.tooltip-inner': feature.get('name')});
    }
    if (currentFeature) {
      tooltip.update();
    } else {
      tooltip.show();
    }
  } else {
    tooltip.hide();
  }
  currentFeature = feature;
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    tooltip.hide();
    currentFeature = undefined;
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel, evt.originalEvent.target);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel, evt.originalEvent.target);
});

map.getTargetElement().addEventListener('pointerleave', function () {
  tooltip.hide();
  currentFeature = undefined;
});
