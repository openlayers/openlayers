import {FetchStore, get, open, root} from 'zarrita';
import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
  withZoom,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const urlSelect = document.getElementById('url-select');
const customUrl = document.getElementById('custom-url');
const loadButton = document.getElementById('load-url');
const groupCol = document.getElementById('group-col');
const groupSelect = document.getElementById('group-select');
const dimsContainer = document.getElementById('dims');
const errorBox = document.getElementById('error');

/**
 * Show a non-fatal error message above the map.
 * @param {Error} error The error to display.
 */
function showError(error) {
  errorBox.textContent = error.message || String(error);
  errorBox.style.display = '';
}

/** Clear any displayed error message. */
function hideError() {
  errorBox.textContent = '';
  errorBox.style.display = 'none';
}

// Sentinel-1 RTC dual-polarization composite: vv -> R, vh -> G, vv/vh -> B.
const BANDS = ['vv', 'vh'];

// Fixed [low, high] value range per composite channel, each mapped to [0, 255].
const COMPOSITE_RESCALE = {
  vv: [0, 0.4], // red
  vh: [0, 0.1], // green
  ratio: [1, 15], // blue (vv / vh)
};

let map;
let rootUrl = ''; // the entered store url (root); the source opens this in multi-group mode
let rootMetadata = {}; // consolidated metadata of the store root (covers every group)
let rootAttributes = {}; // attributes of the store root
let groupPath = ''; // selected child group ('' = the root is itself the multiscales group)
let storeUrl = ''; // url of the selected group, for direct coordinate reads
let metadata = {}; // consolidated metadata scoped to the selected group
let layout = null; // multiscales layout of the selected group
let renderToken = 0; // guards against overlapping (re)renders clobbering the map

function getUrl() {
  return urlSelect.value === 'custom' ? customUrl.value : urlSelect.value;
}

urlSelect.addEventListener('change', () => {
  const custom = urlSelect.value === 'custom';
  customUrl.style.display = custom ? '' : 'none';
  if (custom) {
    customUrl.focus();
  }
});

/**
 * The finest multiscales level (the one with the most pixels).
 * @return {string|null} The level (asset) id.
 */
function finestLevelAsset() {
  if (!layout) {
    return null;
  }
  return layout.reduce((a, b) => {
    const sa = a['spatial:shape']?.[0] ?? 0;
    const sb = b['spatial:shape']?.[0] ?? 0;
    return sb > sa ? b : a;
  }).asset;
}

/**
 * Path of a band array at a level (or the band itself for a single-scale group).
 * @param {string|null} asset The level id.
 * @param {string} band The band name.
 * @return {string} The array path relative to the group.
 */
function bandPath(asset, band) {
  return asset ? `${asset}/${band}` : band;
}

/**
 * Slice consolidated metadata to a group, returning keys relative to that group.
 * @param {Object} cm The consolidated metadata.
 * @param {string} prefix The group path.
 * @return {Object} Metadata with keys relative to the group.
 */
function subMetadata(cm, prefix) {
  const start = `${prefix}/`;
  const sub = {};
  for (const key of Object.keys(cm)) {
    if (key.startsWith(start)) {
      sub[key.slice(start.length)] = cm[key];
    }
  }
  return sub;
}

/**
 * Current value of every dimension selector.
 * @return {Object<string, number>} The selected index per dimension name.
 */
function currentDimensions() {
  const dimensions = {};
  for (const select of dimsContainer.querySelectorAll('select')) {
    dimensions[select.dataset.dim] = Number(select.value);
  }
  return dimensions;
}

/**
 * Convert a CF time value to milliseconds since the Unix epoch.
 * @param {number|bigint} value The encoded time value.
 * @param {string} units A CF units string, e.g. `'nanoseconds since 1970-01-01'`.
 * @return {number|null} Milliseconds since the epoch, or null if not decodable.
 */
function cfTimeToMs(value, units) {
  const match = /^\s*(\w+)\s+since\s+(.+?)\s*$/i.exec(units || '');
  if (!match) {
    return null;
  }
  const perUnitMs = {
    nanosecond: 1e-6,
    nanoseconds: 1e-6,
    microsecond: 1e-3,
    microseconds: 1e-3,
    millisecond: 1,
    milliseconds: 1,
    second: 1000,
    seconds: 1000,
    minute: 60000,
    minutes: 60000,
    hour: 3600000,
    hours: 3600000,
    day: 86400000,
    days: 86400000,
  }[match[1].toLowerCase()];
  if (perUnitMs === undefined) {
    return null;
  }
  let refMs = Date.parse(match[2]);
  if (Number.isNaN(refMs)) {
    refMs = Date.parse(`${match[2].replace(' ', 'T')}Z`);
  }
  if (Number.isNaN(refMs)) {
    return null;
  }
  return Number(value) * perUnitMs + refMs;
}

/**
 * Read a dimension's coordinate array and format its values as option labels,
 * decoding CF time to dates. Returns null when no usable coordinate array is
 * present, so the caller falls back to plain indices.
 * @param {string} dimName The dimension name.
 * @param {number} size The dimension length.
 * @return {Promise<Array<string>|null>} One label per index, or null.
 */
async function coordinateLabels(dimName, size) {
  const path = bandPath(finestLevelAsset(), dimName);
  const meta = metadata[path];
  if (
    !meta ||
    !Array.isArray(meta.shape) ||
    meta.shape.length !== 1 ||
    meta.shape[0] !== size
  ) {
    return null;
  }
  let data;
  try {
    const array = await open(root(new FetchStore(storeUrl)).resolve(path), {
      kind: 'array',
    });
    data = (await get(array)).data;
  } catch {
    return null;
  }
  const units = meta.attributes?.units;
  const isTime =
    meta.attributes?.standard_name === 'time' || /\bsince\b/i.test(units || '');
  const labels = [];
  for (let i = 0; i < size; ++i) {
    const ms = isTime ? cfTimeToMs(data[i], units) : null;
    labels.push(
      ms === null
        ? String(data[i])
        : new Date(ms).toISOString().slice(0, 16).replace('T', ' '),
    );
  }
  return labels;
}

/**
 * Build one dropdown per non-spatial dimension reported by the source, labeling
 * each option with the real coordinate value (e.g. a date) when available.
 * @param {Array<{name: string, size: number}>} dimensions The selectable dimensions.
 * @return {Promise<void>} Resolves when the selectors are built.
 */
async function buildDimensionSelectors(dimensions) {
  dimsContainer.innerHTML = '';
  for (const {name, size} of dimensions) {
    const labels = await coordinateLabels(name, size);
    const group = document.createElement('div');
    group.className = 'input-group';
    const label = document.createElement('label');
    label.className = 'input-group-text';
    label.textContent = isNaN(Number(name)) ? name : `dim ${name}`;
    const select = document.createElement('select');
    select.className = 'form-select';
    select.dataset.dim = name;
    for (let i = 0; i < size; ++i) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = labels ? labels[i] : String(i);
      select.appendChild(option);
    }
    select.addEventListener('change', () => render(false));
    group.appendChild(label);
    group.appendChild(select);
    const col = document.createElement('div');
    col.className = 'col-auto';
    col.appendChild(group);
    dimsContainer.appendChild(col);
  }
}

/**
 * Resolve once the source is ready (or reject on error).
 * @param {GeoZarr} source The source.
 * @return {Promise<void>} Resolves when ready.
 */
function whenReady(source) {
  return new Promise((resolve, reject) => {
    function check() {
      const state = source.getState();
      if (state === 'ready') {
        resolve();
      } else if (state === 'error') {
        reject(source.error_ || new Error('GeoZarr source failed to load'));
      }
    }
    source.on('change', check);
    check();
  });
}

/**
 * WebGL style for the dual-polarization composite: vv -> red, vh -> green,
 * vv/vh -> blue, each rescaled from its fixed [low, high] range (see
 * `COMPOSITE_RESCALE`) to [0, 255].
 * @return {Object} The WebGLTile style.
 */
function compositeStyle() {
  const channel = (value, [low, high]) => [
    'interpolate',
    ['linear'],
    value,
    low,
    0,
    high,
    255,
  ];
  return {
    color: [
      'color',
      channel(['band', 1], COMPOSITE_RESCALE.vv),
      channel(['band', 2], COMPOSITE_RESCALE.vh),
      channel(['/', ['band', 1], ['band', 2]], COMPOSITE_RESCALE.ratio),
    ],
  };
}

/**
 * (Re)render the map for the current group and dimension selections.
 * @param {boolean} rebuildDimensions Rebuild the dimension selectors (after a
 *     group change).
 */
async function render(rebuildDimensions) {
  if (!storeUrl) {
    return;
  }
  const token = ++renderToken;
  // On a group change the dimension selectors still describe the previous group
  // (they are rebuilt below once the new source is ready), so their selected
  // indices may be out of range for the new group. Start the new group at index
  // 0 and let the rebuilt selectors drive later renders.
  const dimensions = rebuildDimensions ? {} : currentDimensions();
  // Open the store root in multi-group mode (bands carry the orbit group). The
  // root's consolidated metadata covers every group, so this works even when a
  // child group's own zarr.json was not consolidated.
  const bands = groupPath
    ? BANDS.map((name) => ({name, group: groupPath}))
    : BANDS;
  const source = new GeoZarr({url: rootUrl, bands, dimensions});
  try {
    await whenReady(source);
    if (token !== renderToken) {
      return; // a newer render started; drop this stale one
    }
    if (rebuildDimensions) {
      await buildDimensionSelectors(source.getDimensions());
      if (token !== renderToken) {
        return;
      }
    }
    hideError();
    if (map) {
      map.setTarget(null);
    }
    map = new Map({
      layers: [
        new TileLayer({source: new OSM()}),
        new TileLayer({style: compositeStyle(), source}),
      ],
      target: 'map',
      view: getView(
        source,
        withLowerResolutions(1),
        withHigherResolutions(2),
        withExtentCenter(),
        withZoom(2),
      ),
    });
  } catch (error) {
    if (token === renderToken) {
      showError(error);
    }
  }
}

/**
 * Discover the renderable groups in a store: the store's own group when it is a
 * multiscales group, otherwise its immediate child groups that are multiscales
 * groups (e.g. the `ascending`/`descending` orbit groups of an S1 RTC cube).
 * @param {Object} group The parsed store-root group zarr.json.
 * @return {Array<string>} Group paths relative to the entered url ('' = the url itself).
 */
function discoverGroups(group) {
  if (group.attributes?.multiscales?.layout) {
    return [''];
  }
  const consolidated = group.consolidated_metadata?.metadata ?? {};
  const groups = [];
  for (const key of Object.keys(consolidated)) {
    if (
      !key.includes('/') &&
      consolidated[key]?.node_type === 'group' &&
      consolidated[key]?.attributes?.multiscales?.layout
    ) {
      groups.push(key);
    }
  }
  return groups.length > 0 ? groups : [''];
}

/** Scope the metadata/layout to the selected group, then render. */
async function loadGroup() {
  groupPath = groupSelect.value;
  storeUrl = groupPath ? `${rootUrl}/${groupPath}` : rootUrl;
  metadata = groupPath ? subMetadata(rootMetadata, groupPath) : rootMetadata;
  const groupAttributes = groupPath
    ? rootMetadata[groupPath]?.attributes
    : rootAttributes;
  layout = groupAttributes?.multiscales?.layout ?? null;
  await render(true);
}

/** Load the entered store: read its (root) metadata, discover groups, render. */
async function load() {
  rootUrl = getUrl();
  if (!rootUrl) {
    return;
  }
  try {
    const response = await fetch(`${rootUrl}/zarr.json`);
    if (!response.ok) {
      throw new Error(
        `Could not read ${rootUrl}/zarr.json (${response.status})`,
      );
    }
    const rootJson = await response.json();
    rootMetadata = rootJson.consolidated_metadata?.metadata ?? {};
    rootAttributes = rootJson.attributes ?? {};
    const groups = discoverGroups(rootJson);
    groupSelect.innerHTML = '';
    for (const path of groups) {
      const option = document.createElement('option');
      option.value = path;
      option.textContent = path || '(root)';
      groupSelect.appendChild(option);
    }
    // Only show the group selector when there is a real choice of subgroups.
    groupCol.style.display =
      groups.length === 1 && groups[0] === '' ? 'none' : '';
    await loadGroup();
  } catch (error) {
    showError(error);
  }
}

groupSelect.addEventListener('change', loadGroup);
loadButton.addEventListener('click', load);

load();
