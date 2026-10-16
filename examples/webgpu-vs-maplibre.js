import {applyBackground, applyStyle} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Link from '../src/ol/interaction/Link.js';
import WebGPUVectorTileLayer from '../src/ol/layer/WebGPUVectorTile.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const styleUrl =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';

// Mapbox GL zoom levels are based on 512 pixel tiles. With the same resolution
// at zoom level 0, view zoom levels match the zoom levels of the style.
const maxResolution = 78271.51696402048;

const layer = new WebGPUVectorTileLayer({
  declutter: true,
  source: new VectorTileSource({}),
});
applyStyle(layer, styleUrl);
applyBackground(layer, styleUrl);

const view = new View({
  center: fromLonLat([13.388, 52.517]),
  zoom: 13,
  maxResolution,
});

const map = new Map({
  layers: [layer],
  target: 'ol-map',
  view,
});
map.addInteraction(new Link());

const initialCenter = view.getCenter() || fromLonLat([13.388, 52.517]);
const [initialLongitude, initialLatitude] = toLonLat(initialCenter);
const maplibreMap = new maplibregl.Map({
  bearing: oppositeBearing((view.getRotation() * 180) / Math.PI),
  center: [initialLongitude, initialLatitude],
  container: 'maplibre-map',
  maxPitch: 0,
  pitchWithRotate: false,
  style: styleUrl,
  zoom: view.getZoom() ?? 13,
});
maplibreMap.addControl(
  new maplibregl.NavigationControl({visualizePitch: false}),
);

let syncing = false;
let syncFrame = 0;

view.on(['change:center', 'change:resolution', 'change:rotation'], () => {
  if (syncing) {
    return;
  }
  scheduleSync(syncOpenLayersToMapLibre);
});

maplibreMap.on('move', () => {
  if (syncing) {
    return;
  }
  scheduleSync(syncMapLibreToOpenLayers);
});

/**
 * Applies a view copy on the next frame so a gesture updates the other map once.
 * @param {function(): void} sync Copies one map's view onto the other.
 */
function scheduleSync(sync) {
  cancelAnimationFrame(syncFrame);
  syncFrame = requestAnimationFrame(() => {
    syncing = true;
    sync();
    syncing = false;
  });
}

/**
 * Copies the OpenLayers view onto the MapLibre map.
 */
function syncOpenLayersToMapLibre() {
  const camera = openLayersCamera();
  if (!camera || sameCamera(camera, mapLibreCamera())) {
    return;
  }
  maplibreMap.jumpTo({
    bearing: oppositeBearing(camera.bearing),
    center: camera.center,
    zoom: camera.zoom,
  });
}

/**
 * Copies the MapLibre view onto the OpenLayers view.
 */
function syncMapLibreToOpenLayers() {
  const camera = mapLibreCamera();
  const current = openLayersCamera();
  if (current && sameCamera(current, camera)) {
    return;
  }
  view.setCenter(fromLonLat(camera.center));
  view.setZoom(camera.zoom);
  view.setRotation((camera.bearing * Math.PI) / 180);
}

/**
 * @typedef {Object} Camera
 * @property {Array<number>} center Longitude and latitude.
 * @property {number} zoom Zoom level.
 * @property {number} bearing Bearing in degrees, clockwise from north.
 */

/**
 * @return {Camera|undefined} The OpenLayers camera, or undefined when the view is not ready.
 */
function openLayersCamera() {
  const center = view.getCenter();
  const zoom = view.getZoom();
  if (!center || zoom === undefined) {
    return undefined;
  }
  return {
    bearing: (view.getRotation() * 180) / Math.PI,
    center: toLonLat(center),
    zoom,
  };
}

/**
 * @return {Camera} The MapLibre camera.
 */
function mapLibreCamera() {
  const center = maplibreMap.getCenter();
  return {
    bearing: oppositeBearing(maplibreMap.getBearing()),
    center: [center.lng, center.lat],
    zoom: maplibreMap.getZoom(),
  };
}

/**
 * @param {Camera} a First camera.
 * @param {Camera} b Second camera.
 * @return {boolean} Whether copying one camera onto the other would not move the map.
 */
function sameCamera(a, b) {
  return (
    sameNumber(a.center[0], b.center[0]) &&
    sameNumber(a.center[1], b.center[1]) &&
    sameNumber(a.zoom, b.zoom) &&
    sameAngle(a.bearing, b.bearing)
  );
}

/**
 * Returns true when two numbers are close enough that copying one onto the
 * other would not move the map.
 * @param {number} a First value.
 * @param {number} b Second value.
 * @return {boolean} Whether the values match.
 */
function sameNumber(a, b) {
  return Math.abs(a - b) < 1e-8;
}

/**
 * OpenLayers rotation is clockwise from north and MapLibre bearing is
 * counter-clockwise, so each is the negative of the other.
 * @param {number} degrees Bearing in degrees in one library's convention.
 * @return {number} The same bearing in the other library's convention.
 */
function oppositeBearing(degrees) {
  return -degrees;
}

/**
 * Returns true when two angles in degrees are the same, wrapping at 360.
 * @param {number} a First angle in degrees.
 * @param {number} b Second angle in degrees.
 * @return {boolean} Whether the angles match.
 */
function sameAngle(a, b) {
  const turns = Math.abs(a - b) / 360;
  const fraction = turns - Math.floor(turns);
  return Math.min(fraction, 1 - fraction) < 1e-6;
}
