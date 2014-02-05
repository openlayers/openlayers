Finding your way around
-----------------------

The [GeoAdmin API](http://api3.geo.admin.ch) is an extension of [OpenLayers 3](http://ol3js.org)
which adds only a few classes and configuration files to OpenLayers 3, to make it easier to
use with the [swiss grid](http://www.swisstopo.admin.ch/internet/swisstopo/en/home/topics/survey/sys/refsys/projections.html) and the layers provided by the swiss confederation and cantons.

See the class list to the right and especially take a look at {@link ga.Map} and the method {@link ga.layer.create}
to add predefined layers.

In general every use of OpenLayers starts by initializing a map, then adding the
required layers. Controls and interactions can be added to change the behavior of the map.

Maps and Layers
---------------
A map in OpenLayers is essentially a staple of layers that is viewed from the top.
Layers are responsible for retrieving data and displaying it.

Projections
-----------
A [GeoAdmin API](http://api3.geo.admin.ch) map uses the swiss grid (EPSG:21781).
An {@link ol.proj.Projection} defines which point on earth is represented by a pair of coordinates.
Coordinates within OpenLayers can be used in various projections where some common projections are always supported,
others can be used via [Proj4js](http://trac.osgeo.org/proj4js/).

Contributing
------------
See [CONTRIBUTING.md](https://github.com/geoadmin/ol3/blob/master/CONTRIBUTING.md) for instructions
on building and testing OpenLayers. The file does also describe how to commit your changes to OpenLayers or GeoAdmin API.
When making a Pull Request, be attentive that the appropriate project (OpenLayers 3 or GeoAdmin API) is used.
