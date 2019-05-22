import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {easeIn, easeOut} from '../src/ol/easing.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';

const london = fromLonLat([-0.12755, 51.507222]);
const moscow = fromLonLat([37.6178, 55.7517]);
const istanbul = fromLonLat([28.9744, 41.0128]);
const rome = fromLonLat([12.5, 41.9]);
const bern = fromLonLat([7.4458, 46.95]);

const view = new View({
  center: istanbul,
  zoom: 6
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      preload: 4,
      source: new OSM()
    })
  ],
  view: view
});

// A bounce easing method (from https://github.com/DmitryBaranovskiy/raphael).
function bounce(t) {
  const s = 7.5625;
  const p = 2.75;
  let l;
  if (t < (1 / p)) {
    l = s * t * t;
  } else {
    if (t < (2 / p)) {
      t -= (1.5 / p);
      l = s * t * t + 0.75;
    } else {
      if (t < (2.5 / p)) {
        t -= (2.25 / p);
        l = s * t * t + 0.9375;
      } else {
        t -= (2.625 / p);
        l = s * t * t + 0.984375;
      }
    }
  }
  return l;
}

// An elastic easing method (from https://github.com/DmitryBaranovskiy/raphael).
function elastic(t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

function onClick(id, callback) {
  document.getElementById(id).addEventListener('click', callback);
}

onClick('rotate-left', function() {
  view.animate({
    rotation: view.getRotation() + Math.PI / 2
  });
});

onClick('rotate-right', function() {
  view.animate({
    rotation: view.getRotation() - Math.PI / 2
  });
});

onClick('rotate-around-rome', function() {
  // Rotation animation takes the shortest arc, so animate in two parts
  const rotation = view.getRotation();
  view.animate({
    rotation: rotation + Math.PI,
    anchor: rome,
    easing: easeIn
  }, {
    rotation: rotation + 2 * Math.PI,
    anchor: rome,
    easing: easeOut
  });
});

onClick('pan-to-london', function() {
  view.animate({
    center: london,
    duration: 2000
  });
});

onClick('elastic-to-moscow', function() {
  view.animate({
    center: moscow,
    duration: 2000,
    easing: elastic
  });
});

onClick('bounce-to-istanbul', function() {
  view.animate({
    center: istanbul,
    duration: 2000,
    easing: bounce
  });
});

onClick('spin-to-rome', function() {
  // Rotation animation takes the shortest arc, so animate in two parts
  const center = view.getCenter();
  view.animate({
    center: [
      center[0] + (rome[0] - center[0]) / 2,
      center[1] + (rome[1] - center[1]) / 2
    ],
    rotation: Math.PI,
    easing: easeIn
  }, {
    center: rome,
    rotation: 2 * Math.PI,
    easing: easeOut
  });
});

function flyTo(location, done) {
  const duration = 2000;
  const zoom = view.getZoom();
  let parts = 2;
  let called = false;
  function callback(complete) {
    --parts;
    if (called) {
      return;
    }
    if (parts === 0 || !complete) {
      called = true;
      done(complete);
    }
  }
  view.animate({
    center: location,
    duration: duration
  }, callback);
  view.animate({
    zoom: zoom - 1,
    duration: duration / 2
  }, {
    zoom: zoom,
    duration: duration / 2
  }, callback);
}

onClick('fly-to-bern', function() {
  flyTo(bern, function() {});
});

function tour() {
  const locations = [london, bern, rome, moscow, istanbul];
  let index = -1;
  function next(more) {
    if (more) {
      ++index;
      if (index < locations.length) {
        const delay = index === 0 ? 0 : 750;
        setTimeout(function() {
          flyTo(locations[index], next);
        }, delay);
      } else {
        alert('Tour complete');
      }
    } else {
      alert('Tour cancelled');
    }
  }
  next(true);
}

onClick('tour', tour);
