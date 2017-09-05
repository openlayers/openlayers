import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_proj_Projection_ from '../src/ol/proj/projection';
import _ol_source_ImageStatic_ from '../src/ol/source/imagestatic';


// Map views always need a projection.  Here we just want to map image
// coordinates directly to map coordinates, so we create a projection that uses
// the image extent in pixels.
var extent = [0, 0, 1024, 968];
var projection = new _ol_proj_Projection_({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Image_({
      source: new _ol_source_ImageStatic_({
        attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
        url: 'https://imgs.xkcd.com/comics/online_communities.png',
        projection: projection,
        imageExtent: extent
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    projection: projection,
    center: _ol_extent_.getCenter(extent),
    zoom: 2,
    maxZoom: 8
  })
});
