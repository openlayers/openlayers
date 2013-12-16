Finding your way around
-----------------------

The [geo.admin.ch API](http://www.geo.admin.ch) is a fork of [OL3](http://ol3js.org)
which add only a few classes and configuration files to the project, to make it easier to
use with the [swiss grid](http://www.swisstopo.admin.ch/internet/swisstopo/en/home/topics/survey/sys/refsys/projections.html)

See the class list to the right and especially take a look at {@link ga.Map} and the method {@link ga.layer.create}
to add predifined layers.

In general every use of OpenLayers starts by initializing a map, then adding the
required layers. Controls and interactions can be added to change the behavior of the map.

Projections
-----------
A [map.geo.admin.ch](http://map3.geo.admin.ch) map uses the swiss grid (EPSG:21781).
A {@link ol.proj.Projection} defines which point on earth is represented by a pair of coordinates.
Coordinates within OpenLayers can be used in various projections where some common projections are always supported,
others can be used via [Proj4js](http://trac.osgeo.org/proj4js/).

Maps and Layers
---------------
A map in OpenLayers is essentially a staple of layers that is viewed from the top.
Layers are responsible for retrieving data and displaying it.

Contributing
------------
See [CONTRIBUTING.md](https://github.com/geoadmin/ol3/blob/master/CONTRIBUTING.md) for instructions
on building and testing OpenLayers. The file does also describe how to commit your changes to OpenLayers.
