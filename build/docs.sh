#!/bin/sh

rm ../doc/reference.html
echo "<html><head><title>OpenLayers Class Reference Documentation</title><style type='text/css'> .type { background-color: #ddd } td { border: black solid 1px; padding: 3px;  } table { border-collapse: collapse; margin: 5px 10px; } .classref { margin-left: 20px; }</style></head><body>" >> ../doc/reference.html
for i in Map Layer Layer.HTTPRequest Layer.Grid Layer.WMS Layer.KaMap Layer.EventPane Layer.Google Layer.VirtualEarth Layer.Markers Layer.Text Layer.GeoRSS Layer.Boxes Icon Marker Marker.Box Tile Tile.Image Tile.WFS Control Control.LayerSwitcher Control.MouseDefaults Control.MouseToolbar Control.PanZoom Control.PanZoomBar Control.Permalink Control.Scale LonLat Size Pixel Bounds; do
cat ../doc/$i.txt | \
perl -pe "s/^(.*?) -- (.*?) -- (.*?)$/  <tr><td>\1<\/td><td>\2<\/td><td>\3<\/td><\/tr>/g" | \
perl -pe "s/^(  \* )?(.*?) -- (.*?)$/  <tr><td>\2<\/td><td>\3<\/td><\/tr>/g" | \
perl -pe "s/^  \* (.*)$/  <\/table>\n\n<h3>\1<\/h3>\n  <table>/" | \
perl -pe "s/{OpenLayers.(.*?)\|(.*?)}/<a href=\"#OpenLayers.\$1\" title=\"OpenLayers.\$1\">\2<\/a>/g" | \
perl -pe "s/{OpenLayers.(.*?)}/<a href=\"#OpenLayers.\$1\" title=\"OpenLayers.\$1\">OpenLayers.\$1<\/a>/g" | \
perl -pe "s/{([A-Za-z]+?)\|(.+?)}/<span class=\"type\" title=\"\\1\">\2<\/span>/g" | \
perl -pe "s/{([A-Za-z]+?)}/<span class=\"type\" title=\"\$1\">\$1<\/span>/g" | \
perl -pe "s/^\* (.*)$/<\/table>\n<h2>\1<\/h2>\n<table>/" | \
perl -pe "s/^OpenLayers\.(.*)$/<h1><a name=\"OpenLayers.\$1\">OpenLayers.\$1<\/a><\/h1><div class='classref'>/" >> ../doc/reference.html; echo "</table></div>" >> ../doc/reference.html
done
echo "</body></html>" >> ../doc/reference.html
