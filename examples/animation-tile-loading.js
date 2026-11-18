import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {distance} from '../src/ol/coordinate.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import {ATTRIBUTION} from '../src/ol/source/OSM.js';
import {DROP} from '../src/ol/structs/PriorityQueue.js';

const bern = fromLonLat([7.4458, 46.95]);
const zurich = fromLonLat([8.5417, 47.3769]);

const flyButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('fly')
);
const panButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('pan')
);
const clearFirst = /** @type {HTMLInputElement} */ (
  document.getElementById('clear-first')
);
const delaySelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('delay')
);
const pullRequestOrder = /** @type {HTMLInputElement} */ (
  document.getElementById('pull-request-order')
);
const status = /** @type {HTMLElement} */ (document.getElementById('status'));

/**
 * Number of tiles requested since the tiles were last cleared.
 */
let sequence = 0;

/**
 * The flight being measured.
 * @type {{duration: number, sequence: number, finished: number}|null}
 */
let flight = null;

/**
 * @param {number} z Tile z.
 * @param {number} x Tile x.
 * @param {number} y Tile y.
 * @return {Promise<HTMLCanvasElement>} The tile, stamped with its number.
 */
async function loader(z, x, y) {
  const number = ++sequence;
  const delay = Number(delaySelect.value);
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = /** @type {CanvasRenderingContext2D} */ (
    canvas.getContext('2d')
  );
  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    await image.decode();
    context.drawImage(image, 0, 0, 256, 256);
  } catch {
    context.fillStyle = '#ccc';
    context.fillRect(0, 0, 256, 256);
  }
  context.font = 'bold 72px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 8;
  context.strokeStyle = 'white';
  context.strokeText(String(number), 128, 128);
  context.fillStyle = '#222';
  context.fillText(String(number), 128, 128);
  if (flight && number > flight.sequence) {
    ++flight.finished;
  }
  return canvas;
}

/**
 * A new source each time the tiles are cleared: with `refresh()`, the layer
 * would keep showing the old tiles until the new ones arrive.
 * @return {ImageTile} The source.
 */
function createSource() {
  return new ImageTile({
    attributions: ATTRIBUTION,
    loader: loader,
    transition: 0,
  });
}

/**
 * A map that can switch back to the tile priority from before this change:
 * zoom level first, then distance from the center on screen.
 */
class TileOrderMap extends Map {
  /**
   * @param {import("../src/ol/Tile.js").default} tile Tile.
   * @param {string} tileSourceKey Tile source key.
   * @param {import("../src/ol/coordinate.js").Coordinate} tileCenter Tile center.
   * @param {number} tileResolution Tile resolution.
   * @return {number} Tile priority.
   * @override
   */
  getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
    const priority = super.getTilePriority(
      tile,
      tileSourceKey,
      tileCenter,
      tileResolution,
    );
    if (pullRequestOrder.checked || priority === DROP) {
      return priority;
    }
    const viewState = this.getView().getState();
    return (
      65536 * Math.log(tileResolution) +
      distance(tileCenter, viewState.center) / tileResolution
    );
  }
}

const view = new View({
  center: bern,
  zoom: 12,
});

const layer = new TileLayer({source: createSource()});

const map = new TileOrderMap({
  target: 'map',
  layers: [layer],
  view: view,
});

/**
 * Animate the view and report what was loaded on the way.
 * @param {import("../src/ol/coordinate.js").Coordinate} center Target center.
 * @param {number} duration Duration.
 */
function animate(center, duration) {
  view.cancelAnimations();
  // In the same tick as the animation, so that its first frame queues the
  // tiles of both the current view and the destination.
  if (clearFirst.checked) {
    flight = null;
    sequence = 0;
    layer.setSource(createSource());
  }
  const current = {duration: duration, sequence: sequence, finished: 0};
  flight = current;
  status.textContent = `Flight ${duration} ms...`;
  view.animate({center: center, duration: duration}, function () {
    if (flight !== current) {
      return;
    }
    const requested = sequence - current.sequence;
    const finished = current.finished;
    const summary =
      `Flight ${duration} ms. ` +
      `Requested during the flight: ${requested}, finished: ${finished}.`;
    status.textContent = summary;
    const landed = Date.now();
    map.once('rendercomplete', function () {
      if (flight !== current) {
        return;
      }
      flight = null;
      status.textContent =
        summary + ` View complete ${Date.now() - landed} ms after landing.`;
    });
  });
}

let atBern = true;
flyButton.addEventListener('click', function () {
  animate(atBern ? zurich : bern, 2000);
  atBern = !atBern;
  flyButton.textContent = atBern ? 'Fly to Zürich' : 'Fly to Bern';
});

let panDirection = 1;
panButton.addEventListener('click', function () {
  const size = /** @type {import("../src/ol/size.js").Size} */ (map.getSize());
  const resolution = /** @type {number} */ (view.getResolution());
  const center = /** @type {import("../src/ol/coordinate.js").Coordinate} */ (
    view.getCenter()
  );
  const shift = (panDirection * size[0] * resolution) / 2;
  panDirection = -panDirection;
  animate([center[0] + shift, center[1]], 300);
});
