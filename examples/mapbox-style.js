import olms from 'ol-mapbox-style';
import FullScreen from '../src/ol/control/FullScreen.js';

olms(
  'map',
  'https://api.maptiler.com/maps/outdoor-v2/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB',
).then(function (map) {
  map.addControl(new FullScreen());
});
