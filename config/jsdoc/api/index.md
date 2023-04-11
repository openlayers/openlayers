<div class="row mb-3">
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Map</h4>
        <p>A <a href="module-ol_Map-Map.html">map</a> is made of <a href="module-ol_layer_Base-BaseLayer.html">layers</a>, a <a href="module-ol_View-View.html">view</a> to visualize them, <a href="module-ol_interaction_Interaction-Interaction.html">interactions</a> to modify map content and <a href="module-ol_control_Control-Control.html">controls</a> with UI components.</p>
        <a href="module-ol_Map-Map.html">Overview</a><br>
        <a href="module-ol_Map-Map.html#Map">Creation</a><br>
        <a href="module-ol_MapBrowserEvent-MapBrowserEvent.html">Events</a>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">View</h4>
        <p>The view manages the visual parameters of the map view, like resolution or rotation.</p>
        <a href="module-ol_View-View.html">View</a> with center, projection, resolution and rotation
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Layers</h4>
        <p>Layers are lightweight containers that get their data from <a href="module-ol_source_Source-Source.html">sources</a>.</p>
        <a href="module-ol_layer_Tile-TileLayer.html">ol/layer/Tile</a><br>
        <a href="module-ol_layer_Image-ImageLayer.html">ol/layer/Image</a><br>
        <a href="module-ol_layer_Vector-VectorLayer.html">ol/layer/Vector</a><br>
        <a href="module-ol_layer_VectorImage-VectorImageLayer.html">ol/layer/VectorImage</a><br>
        <a href="module-ol_layer_VectorTile-VectorTileLayer.html">ol/layer/VectorTile</a><br>
        <a href="module-ol_layer_WebGLTile-WebGLTileLayer.html">ol/layer/WebGLTile</a>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Controls</h4>
        <a href="module-ol_control_defaults#.defaults">Map default controls</a><br>
        <a href="module-ol_control_Control-Control.html">All controls</a>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Interactions</h4>
        <a href="module-ol_interaction_defaults#.defaults">Map default interactions</a><br>
        Interactions for <a href="module-ol_Feature-Feature.html">vector features</a>
        <ul><li><a href="module-ol_interaction_Select-Select.html">ol/interaction/Select</a></li>
          <li><a href="module-ol_interaction_Draw-Draw.html">ol/interaction/Draw</a></li>
          <li><a href="module-ol_interaction_Modify-Modify.html">ol/interaction/Modify</a></li>
        </ul>
        <a href="module-ol_interaction_Interaction-Interaction.html">All interactions</a>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Sources and formats</h4>
        <a href="module-ol_source_Tile-TileSource.html">Tile sources</a> for <a href="module-ol_layer_Tile-TileLayer.html">ol/layer/Tile</a> or <a href="module-ol_layer_WebGLTile-WebGLTileLayer.html">ol/layer/WebGLTile</a>
        <br><a href="module-ol_source_Image-ImageSource.html">Image sources</a> for <a href="module-ol_layer_Image-ImageLayer.html">ol/layer/Image</a>
        <br><a href="module-ol_source_Vector-VectorSource.html">Vector sources</a> for <a href="module-ol_layer_Vector-VectorLayer.html">ol/layer/Vector</a>
        <br><a href="module-ol_source_VectorTile-VectorTile.html">Vector tile sources</a> for <a href="module-ol_layer_VectorTile-VectorTileLayer.html">ol/layer/VectorTile</a>
        <br><a href="module-ol_format_Feature-FeatureFormat.html">Formats</a> for reading/writing vector data
        <br><a href="module-ol_format_WMSCapabilities-WMSCapabilities.html">ol/format/WMSCapabilities</a>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Projections</h4>
          <p>All coordinates and extents need to be provided in view projection (default: EPSG:3857). To transform coordinates from and to geographic, use <a href="module-ol_proj.html#.fromLonLat">fromLonLat()</a> and <a href="module-ol_proj.html#.toLonLat">toLonLat()</a>. For extents and other projections, use <a href="module-ol_proj.html#.transformExtent">transformExtent()</a> and <a href="module-ol_proj.html#.transform">transform()</a>.</p>
          <p>Find these functions and more in the <a href="module-ol_proj.html">ol/proj</a> module.</p>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Observable objects</h4>
        <p>Changes to all <a href="module-ol_Object-BaseObject.html">Object</a>s can be observed by calling the <a href="module-ol_Object-BaseObject.html#on">object.on('propertychange')</a> method.  Listeners receive an <a href="module-ol_Object.ObjectEvent.html">ObjectEvent</a> with information on the changed property and old value.</p>
      </div>
    </div>
  </div>
  <div class="col-xl-4 col-lg-6 py-3">
    <div class="card h-100 bg-light">
      <div class="card-body">
        <h4 class="card-title">Other components</h4>
        <a href="module-ol_Geolocation.html">ol/Geolocation</a><br>
        <a href="module-ol_Overlay-Overlay.html">ol/Overlay</a><br>
      </div>
    </div>
  </div>
</div>

<h3 class="mb-3">API change policy</h3>
The OpenLayers API consists of
<ul>
  <li>names and signatures of constructors</li>
  <li>names and signatures of instance methods and properties</li>
  <li>names and signatures of functions</li>
  <li>names of constants</li>
</ul>
<p>Within a major release series, the API will not be changed.  Any changes to the API will be accompanied by a new major release.</p>
<p class="text-danger">Note: The API change policy does not cover CSS class names that are used to style the OpenLayers UI. It also does not cover any typedefs and enums.</p>
