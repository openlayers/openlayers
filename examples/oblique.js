import GeoTIFF from "../src/ol/source/GeoTIFF.js";
import Map from "../src/ol/Map.js";
import Projection from "../src/ol/proj/Projection.js";
import TileLayer from "../src/ol/layer/WebGLTile.js";
import View from "../src/ol/View.js";
import proj4 from "proj4";
import { getCenter } from "../src/ol/extent.js";
import { register } from "../src/ol/proj/proj4.js";


// In reality this does not matter as GeoTIFF.js nulls the projection...
// It would however be nice if you could send a flag to use the supplied projection, with extent
// Instead of assuming that the geoKeys attribute is present, when for oblique imagery it might not. 
const projection = new Projection({
  code: "oblique-image",
  extent: [0,0,13470,8670],
});

const cogExtent = [0,0,13470,8670]; // Correspond to the width and height of the image [xmin, ymin, xmax, ymax] 
const cogUrl =
  "https://tmp-asger-public.s3.eu-central-1.amazonaws.com/2017_84_40_1_0015_00008062.cog.tif";
const cog_layer =  new TileLayer({
    source: new GeoTIFF({
      sources: [
        {
          test: true, // To test stuff that wont break existing functionality
          projection: projection,
          url: cogUrl,
        },
      ],
    }),
    extent: cogExtent,
  });
const map = new Map({
  target: "map",
  layers: [
    cog_layer,
  ],
  view: new View({
    center: getCenter(cogExtent),
    extent: cogExtent,
    zoom: 12, //Not sure how this value correspond to relative zoom
  }),
});