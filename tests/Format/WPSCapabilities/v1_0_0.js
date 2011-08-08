var doc = new OpenLayers.Format.XML().read(
'<?xml version="1.0" encoding="UTF-8"?>' +
'<wps:Capabilities xml:lang="en" service="WPS" version="1.0.0"' +
'    xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd"' +
'    xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1"' +
'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xlink="http://www.w3.org/1999/xlink">' +
'    <ows:ServiceIdentification>' +
'        <ows:Title>Prototype GeoServer WPS</ows:Title>' +
'        <ows:Abstract/>' +
'        <ows:ServiceType>WPS</ows:ServiceType>' +
'        <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>' +
'    </ows:ServiceIdentification>' +
'    <ows:ServiceProvider>' +
'        <ows:ProviderName>The ancient geographes INC</ows:ProviderName>' +
'        <ows:ProviderSite xlink:href="http://geoserver.org"/>' +
'        <ows:ServiceContact/>' +
'    </ows:ServiceProvider>' +
'    <ows:OperationsMetadata>' +
'        <ows:Operation name="GetCapabilities">' +
'            <ows:DCP>' +
'                <ows:HTTP>' +
'                    <ows:Get xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                    <ows:Post xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                </ows:HTTP>' +
'            </ows:DCP>' +
'        </ows:Operation>' +
'        <ows:Operation name="DescribeProcess">' +
'            <ows:DCP>' +
'                <ows:HTTP>' +
'                    <ows:Get xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                    <ows:Post xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                </ows:HTTP>' +
'            </ows:DCP>' +
'        </ows:Operation>' +
'        <ows:Operation name="Execute">' +
'            <ows:DCP>' +
'                <ows:HTTP>' +
'                    <ows:Get xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                    <ows:Post xlink:href="http://localhost:8080/geoserver/wps"/>' +
'                </ows:HTTP>' +
'            </ows:DCP>' +
'        </ows:Operation>' +
'    </ows:OperationsMetadata>' +
'    <wps:ProcessOfferings>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>gt:Intersect</ows:Identifier>' +
'            <ows:Title>Intersection</ows:Title>' +
'            <ows:Abstract>Intersection between two literal geometry</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:length</ows:Identifier>' +
'            <ows:Title>Returns the geometry perimeters, computed using cartesian geometry' +
'                expressions in the same unit of measure as the geometry (will not return a valid' +
'                perimeter for geometries expressed geographic coordinates</ows:Title>' +
'            <ows:Abstract>Returns the geometry perimeters, computed using cartesian geometry' +
'                expressions in the same unit of measure as the geometry (will not return a valid' +
'                perimeter for geometries expressed geographic coordinates</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:isEmpty</ows:Identifier>' +
'            <ows:Title>Checks if the provided geometry is empty</ows:Title>' +
'            <ows:Abstract>Checks if the provided geometry is empty</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:contains</ows:Identifier>' +
'            <ows:Title>Checks if a contains b</ows:Title>' +
'            <ows:Abstract>Checks if a contains b</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:disjoint</ows:Identifier>' +
'            <ows:Title>Returns true if the two geometries have no points in common</ows:Title>' +
'            <ows:Abstract>Returns true if the two geometries have no points in common</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:intersects</ows:Identifier>' +
'            <ows:Title>Returns true if the two geometries intersect, false otherwise</ows:Title>' +
'            <ows:Abstract>Returns true if the two geometries intersect, false' +
'                otherwise</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:isClosed</ows:Identifier>' +
'            <ows:Title>Returns true if the line is closed</ows:Title>' +
'            <ows:Abstract>Returns true if the line is closed</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:isValid</ows:Identifier>' +
'            <ows:Title>Returns true if the geometry is topologically valid, false' +
'                otherwise</ows:Title>' +
'            <ows:Abstract>Returns true if the geometry is topologically valid, false' +
'                otherwise</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:buffer</ows:Identifier>' +
'            <ows:Title>Buffers a geometry using a certain distance</ows:Title>' +
'            <ows:Abstract>Buffers a geometry using a certain distance</ows:Abstract>' +
'        </wps:Process>' +
'        <wps:Process wps:processVersion="1.0.0">' +
'            <ows:Identifier>JTS:getY</ows:Identifier>' +
'            <ows:Title>Returns the Y ordinate of the point</ows:Title>' +
'            <ows:Abstract>Returns the Y ordinate of the point</ows:Abstract>' +
'        </wps:Process>' +
'    </wps:ProcessOfferings>' +
'    <wps:Languages>' +
'        <wps:Default>' +
'            <ows:Language>en-US</ows:Language>' +
'        </wps:Default>' +
'        <wps:Supported>' +
'            <ows:Language>en-US</ows:Language>' +
'        </wps:Supported>' +
'    </wps:Languages>' +
'</wps:Capabilities>'
);
