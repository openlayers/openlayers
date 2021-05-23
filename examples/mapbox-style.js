import FullScreen from '../src/ol/control/FullScreen.js';
import olms from 'ol-mapbox-style';

olms(
  'map',
  'https://api.maptiler.com/maps/topo/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
).then(function (map) {
  map.addControl(new FullScreen());
});
