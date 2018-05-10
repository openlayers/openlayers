import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import TileWMS from '../src/ol/source/TileWMS.js';


const layers = [
   new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'https://msdisweb.missouri.edu/arcgis/services/Geological_Geophysical/MO_2016_Inventory_of_Landslide_Occurrences/MapServer/WMSServer?',
      params: {'LAYERS': '0', 'VERSION': '1.1.0'},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0
    })
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
