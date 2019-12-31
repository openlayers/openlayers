<table><tr>
<th width="33.3%">Map</th><th width="33.3%">View</th><th width="33.3%">Layers</th>
</tr><tr>
<td><p>A <a href="module-ol_Map-Map.html">map</a> is made of <a href="module-ol_layer_Base-BaseLayer.html">layers</a>, a <a href="module-ol_View-View.html">view</a> to visualize them, <a href="module-ol_interaction_Interaction-Interaction.html">interactions</a> to modify map content and <a href="module-ol_control_Control-Control.html">controls</a> with UI components.</p>
<a href="module-ol_Map-Map.html">Overview</a><br>
<a href="module-ol_Map-Map.html#Map">Creation</a><br>
<a href="module-ol_MapBrowserEvent-MapBrowserEvent.html">Events</a></td>
<td><p>The view manages the visual parameters of the map view, like resolution or rotation.</p>
<a href="module-ol_View-View.html">View</a> with center, projection, resolution and rotation</td>
<td><p>Layers are lightweight containers that get their data from <a href="module-ol_source_Source-Source.html">sources</a>.</p>
<a href="module-ol_layer_Tile-TileLayer.html">ol/layer/Tile</a><br>
<a href="module-ol_layer_Image-ImageLayer.html">ol/layer/Image</a><br>
<a href="module-ol_layer_Vector-VectorLayer.html">ol/layer/Vector</a><br>
<a href="module-ol_layer_VectorTile-VectorTileLayer.html">ol/layer/VectorTile</a></td>
</tr><tr>
<th>Controls</th><th>Interactions</th><th>Sources and formats</th>
</tr><tr>
<td><a href="module-ol_control.html#.defaults">Map default controls</a><br>
<a href="module-ol_control_Control-Control.html">All controls</a>
</td>
<td>
<a href="module-ol_interaction.html#~defaults">Map default interactions</a><br>
Interactions for <a href="module-ol_Feature-Feature.html">vector features</a>
<ul><li><a href="module-ol_interaction_Select-Select.html">ol/interaction/Select</a></li>
<li><a href="module-ol_interaction_Draw-Draw.html">ol/interaction/Draw</a></li>
<li><a href="module-ol_interaction_Modify-Modify.html">ol/interaction/Modify</a></li></ul>
<a href="module-ol_interaction_Interaction-Interaction.html">All interactions</a></td>
<td><a href="module-ol_source_Tile-TileSource.html">Tile sources</a> for <a href="module-ol_layer_Tile-TileLayer.html">ol/layer/Tile</a>
<br><a href="module-ol_source_Image-ImageSource.html">Image sources</a> for <a href="module-ol_layer_Image-ImageLayer.html">ol/layer/Image</a>
<br><a href="module-ol_source_Vector-VectorSource.html">Vector sources</a> for <a href="module-ol_layer_Vector-VectorLayer.html">ol/layer/Vector</a>
<br><a href="module-ol_source_VectorTile-VectorTile.html">Vector tile sources</a> for <a href="module-ol_layer_VectorTile-VectorTileLayer.html">ol/layer/VectorTile</a>
<br><a href="module-ol_format_Feature-FeatureFormat.html">Formats</a> for reading/writing vector data
<br><a href="module-ol_format_WMSCapabilities-WMSCapabilities.html">ol/format/WMSCapabilities</a></td></tr>
<tr><th>Projections</th><th>Observable objects</th><th>Other components</th></tr>
<tr><td><p>All coordinates and extents need to be provided in view projection (default: EPSG:3857). To transform, use <a href="module-ol_proj.html#.transform">ol/proj#transform()</a> and <a href="module-ol_proj.html#.transformExtent">ol/proj#transformExtent()</a>.</p>
<a href="module-ol_proj.html">ol/proj</a></td>
<td><p>Changes to all <a href="module-ol_Object-BaseObject.html">ol/Object</a>s can be observed by calling the <a href="module-ol_Object-BaseObject.html#on">object.on('propertychange')</a> method.  Listeners receive an <a href="module-ol_Object.ObjectEvent.html">ol/Object.ObjectEvent</a> with information on the changed property and old value.</p>
<td>
<a href="module-ol_Geolocation.html">ol/Geolocation</a><br>
<a href="module-ol_Overlay-Overlay.html">ol/Overlay</a><br></td>
</tr></table>

&nbsp;

#### API change policy

The OpenLayers API consists of
* names and signatures of constructors
* names and signatures of instance methods and properties
* names and signatures of functions
* names of constants

Within a major release series, the API will not be changed.  Any changes to the API will be accompanied by a new major release.

*Note*: The API change policy does not cover CSS class names that are used to style the OpenLayers UI. It also does not cover any typedefs and enums.
