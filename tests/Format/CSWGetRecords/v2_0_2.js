var csw_request = 
'<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="2.0.2" resultType="results" startPosition="10" maxRecords="20">' +
  '<csw:Query typeNames="csw:Record">' +
    '<csw:ElementSetName>brief</csw:ElementSetName>' +
    '<csw:Constraint version="1.1.0">' +
      '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
        '<ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">' +
          '<ogc:PropertyName>my_prop</ogc:PropertyName>' +
          '<ogc:Literal>my_prop_value</ogc:Literal>' +
        '</ogc:PropertyIsLike>' +
      '</ogc:Filter>' +
    '</csw:Constraint>' +
  '</csw:Query>' +
'</csw:GetRecords>';

var csw_response = 
'<?xml version="1.0" encoding="UTF-8"?>' +
'<csw:GetRecordsResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">' +
  '<csw:SearchStatus timestamp="2009-06-08T12:03:34" />' +
  '<csw:SearchResults numberOfRecordsMatched="10" numberOfRecordsReturned="2" elementSet="brief" nextRecord="3">' +
    '<csw:BriefRecord xmlns:geonet="http://www.fao.org/geonetwork" xmlns:ows="http://www.opengis.net/ows" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:identifier>895ac38b-7aef-4a21-b593-b35a6fc7bba9</dc:identifier>' +
      '<dc:title>Sample title</dc:title>' +
      '<ows:BoundingBox crs="::Lambert Azimuthal Projection">' +
        '<ows:LowerCorner>156 -3</ows:LowerCorner>' +
        '<ows:UpperCorner>37 83</ows:UpperCorner>' +
      '</ows:BoundingBox>' +
      '<ows:BoundingBox crs="::WGS 1984">' +
        '<ows:LowerCorner>51.1 -34.6</ows:LowerCorner>' +
        '<ows:UpperCorner>-17.3 38.2</ows:UpperCorner>' +
      '</ows:BoundingBox>' +
    '</csw:BriefRecord>' +
    '<csw:BriefRecord xmlns:geonet="http://www.fao.org/geonetwork" xmlns:ows="http://www.opengis.net/ows" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:identifier>8a7245c3-8546-42de-8e6f-8fb8b5fd1bc3</dc:identifier>' +
      '<dc:title>Second record : sample title</dc:title>' +
      '<ows:BoundingBox crs="::WGS 1984">' +
        '<ows:LowerCorner>51.1 -34.6</ows:LowerCorner>' +
        '<ows:UpperCorner>-17.3 38.2</ows:UpperCorner>' +
      '</ows:BoundingBox>' +
    '</csw:BriefRecord>' +
  '</csw:SearchResults>' +
'</csw:GetRecordsResponse>'
;

