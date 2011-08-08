var doc = new OpenLayers.Format.XML().read(
'<?xml version="1.0" encoding="UTF-8"?>' +
'<sos:Capabilities version="1.0.0" updateSequence="2005-12-14T10:12:39+01" xsi:schemaLocation="http://www.opengis.net/sos/1.0 http://schemas.opengis.net/sos/1.0.0/sosAll.xsd" xmlns:sos="http://www.opengis.net/sos/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink">' +
  '<ows:ServiceIdentification xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:om="http://www.opengis.net/om/1.0" xmlns:swe="http://www.opengis.net/swe/1.0">' +
    '<ows:Title>IFGI WeatherSOS (stable)</ows:Title>' +
    '<ows:Abstract>WeatherSOS (stable) at IfGI, Muenster, Germany. For more info: http://ifgipedia.uni-muenster.de/kms/documentation/swsl/sos/</ows:Abstract>' +
    '<ows:Keywords>' +
      '<ows:Keyword>rain gauge, radiation, pressure, windspeed, winddirection, temperature</ows:Keyword>' +
    '</ows:Keywords>' +
    '<ows:ServiceType codeSpace="http://opengeospatial.net">OGC:SOS</ows:ServiceType>' +
    '<ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>' +
    '<ows:Fees>NONE</ows:Fees>' +
    '<ows:AccessConstraints>NONE</ows:AccessConstraints>' +
  '</ows:ServiceIdentification>' +
  '<ows:ServiceProvider xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:om="http://www.opengis.net/om/1.0" xmlns:swe="http://www.opengis.net/swe/1.0">' +
    '<ows:ProviderName>Institute for Geoinformatics, University of Muenster</ows:ProviderName>' +
    '<ows:ProviderSite xlink:href="http://ifgi.uni-muenster.de"/>' +
    '<ows:ServiceContact>' +
      '<ows:IndividualName>Eike Hinderk Juerrens</ows:IndividualName>' +
      '<ows:PositionName>Student Associate</ows:PositionName>' +
      '<ows:ContactInfo>' +
        '<ows:Phone>' +
          '<ows:Voice>+49-251-83-30088</ows:Voice>' +
        '</ows:Phone>' +
        '<ows:Address>' +
          '<ows:DeliveryPoint>Weselerstrasse 253</ows:DeliveryPoint>' +
          '<ows:City>Muenster</ows:City>' +
          '<ows:AdministrativeArea>NRW</ows:AdministrativeArea>' +
          '<ows:PostalCode>48149</ows:PostalCode>' +
          '<ows:Country>Germany</ows:Country>' +
          '<ows:ElectronicMailAddress>ehjuerrens@uni-muenster.de</ows:ElectronicMailAddress>' +
        '</ows:Address>' +
      '</ows:ContactInfo>' +
      '<ows:Role/>' +
    '</ows:ServiceContact>' +
  '</ows:ServiceProvider>' +
  '<ows:OperationsMetadata xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:om="http://www.opengis.net/om/1.0" xmlns:swe="http://www.opengis.net/swe/1.0">' +
    '<ows:Operation name="GetCapabilities">' +
      '<ows:DCP>' +
        '<ows:HTTP>' +
          '<ows:Get xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos?"/>' +
          '<ows:Post xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos"/>' +
        '</ows:HTTP>' +
      '</ows:DCP>' +
      '<ows:Parameter name="service">' +
        '<ows:AllowedValues>' +
          '<ows:Value>SOS</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="updateSequence">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="AcceptVersions">' +
        '<ows:AllowedValues>' +
          '<ows:Value>1.0.0</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="Sections">' +
        '<ows:AllowedValues>' +
          '<ows:Value>ServiceIdentification</ows:Value>' +
          '<ows:Value>ServiceProvider</ows:Value>' +
          '<ows:Value>OperationsMetadata</ows:Value>' +
          '<ows:Value>Contents</ows:Value>' +
          '<ows:Value>All</ows:Value>' +
          '<ows:Value>Filter_Capabilities</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="AcceptFormats">' +
        '<ows:AllowedValues>' +
          '<ows:Value>text/xml</ows:Value>' +
          '<ows:Value>application/zip</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
    '</ows:Operation>' +
    '<ows:Operation name="GetObservation">' +
      '<ows:DCP>' +
        '<ows:HTTP>' +
          '<ows:Post xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos"/>' +
        '</ows:HTTP>' +
      '</ows:DCP>' +
      '<ows:Parameter name="version">' +
        '<ows:AllowedValues>' +
          '<ows:Value>1.0.0</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="service">' +
        '<ows:AllowedValues>' +
          '<ows:Value>SOS</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="srsName">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="offering">' +
        '<ows:AllowedValues>' +
          '<ows:Value>ATMOSPHERIC_TEMPERATURE</ows:Value>' +
          '<ows:Value>RAIN_GAUGE</ows:Value>' +
          '<ows:Value>WIND_DIRECTION</ows:Value>' +
          '<ows:Value>WIND_SPEED</ows:Value>' +
          '<ows:Value>HUMIDITY</ows:Value>' +
          '<ows:Value>LUMINANCE</ows:Value>' +
          '<ows:Value>ATMOSPHERIC_PRESSURE</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="eventTime">' +
        '<ows:AllowedValues>' +
          '<ows:Range>' +
            '<ows:MinimumValue>2008-02-14T11:03:02+01</ows:MinimumValue>' +
            '<ows:MaximumValue>2009-11-04T14:45:00+01</ows:MaximumValue>' +
          '</ows:Range>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="procedure">' +
        '<ows:AllowedValues>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111</ows:Value>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="observedProperty">' +
        '<ows:AllowedValues>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::Temperature</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::Precipitation1Hour</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::WindDirection</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::WindSpeed</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::RelativeHumidity</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::Luminance</ows:Value>' +
          '<ows:Value>urn:x-ogc:def:property:OGC::BarometricPressure</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="featureOfInterest">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="result">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="responseFormat">' +
        '<ows:AllowedValues>' +
          '<ows:Value>text/xml;subtype="OM/1.0.0"</ows:Value>' +
          '<ows:Value>application/zip</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="resultModel">' +
        '<ows:AllowedValues>' +
          '<ows:Value>om:Observation</ows:Value>' +
          '<ows:Value>om:CategoryObservation</ows:Value>' +
          '<ows:Value>om:Measurement</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="responseMode">' +
        '<ows:AllowedValues>' +
          '<ows:Value>resultTemplate</ows:Value>' +
          '<ows:Value>inline</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
    '</ows:Operation>' +
    '<ows:Operation name="GetObservationById">' +
      '<ows:DCP>' +
        '<ows:HTTP>' +
          '<ows:Post xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos"/>' +
        '</ows:HTTP>' +
      '</ows:DCP>' +
      '<ows:Parameter name="version">' +
        '<ows:AllowedValues>' +
          '<ows:Value>1.0.0</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="service">' +
        '<ows:AllowedValues>' +
          '<ows:Value>SOS</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="srsName">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="ObservationId">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="responseFormat">' +
        '<ows:AllowedValues>' +
          '<ows:Value>text/xml;subtype="OM/1.0.0"</ows:Value>' +
          '<ows:Value>application/zip</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="resultModel">' +
        '<ows:AllowedValues>' +
          '<ows:Value>om:Observation</ows:Value>' +
          '<ows:Value>om:CategoryObservation</ows:Value>' +
          '<ows:Value>om:Measurement</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="responseMode">' +
        '<ows:AllowedValues>' +
          '<ows:Value>inline</ows:Value>' +
          '<ows:Value>resultTemplate</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
    '</ows:Operation>' +
    '<ows:Operation name="DescribeSensor">' +
      '<ows:DCP>' +
        '<ows:HTTP>' +
          '<ows:Post xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos"/>' +
        '</ows:HTTP>' +
      '</ows:DCP>' +
      '<ows:Parameter name="version">' +
        '<ows:AllowedValues>' +
          '<ows:Value>1.0.0</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="service">' +
        '<ows:AllowedValues>' +
          '<ows:Value>SOS</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="outputFormat">' +
        '<ows:AllowedValues>' +
          '<ows:Value>text/xml;subtype="sensorML/1.0.1"</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="procedure">' +
        '<ows:AllowedValues>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111</ows:Value>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
    '</ows:Operation>' +
    '<ows:Operation name="GetFeatureOfInterest">' +
      '<ows:DCP>' +
        '<ows:HTTP>' +
          '<ows:Post xlink:href="http://v-swe.uni-muenster.de:8080/WeatherSOS/sos"/>' +
        '</ows:HTTP>' +
      '</ows:DCP>' +
      '<ows:Parameter name="service">' +
        '<ows:AllowedValues>' +
          '<ows:Value>SOS</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="version">' +
        '<ows:AllowedValues>' +
          '<ows:Value>1.0.0</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="featureOfInterestId">' +
        '<ows:AllowedValues>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93</ows:Value>' +
          '<ows:Value>urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111</ows:Value>' +
        '</ows:AllowedValues>' +
      '</ows:Parameter>' +
      '<ows:Parameter name="location">' +
        '<ows:AnyValue/>' +
      '</ows:Parameter>' +
    '</ows:Operation>' +
  '</ows:OperationsMetadata>' +
  '<sos:Filter_Capabilities xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:om="http://www.opengis.net/om/1.0" xmlns:swe="http://www.opengis.net/swe/1.0">' +
    '<ogc:Spatial_Capabilities>' +
      '<ogc:GeometryOperands>' +
        '<ogc:GeometryOperand>gml:Envelope</ogc:GeometryOperand>' +
        '<ogc:GeometryOperand>gml:Polygon</ogc:GeometryOperand>' +
        '<ogc:GeometryOperand>gml:Point</ogc:GeometryOperand>' +
        '<ogc:GeometryOperand>gml:LineString</ogc:GeometryOperand>' +
      '</ogc:GeometryOperands>' +
      '<ogc:SpatialOperators>' +
        '<ogc:SpatialOperator name="BBOX"/>' +
        '<ogc:SpatialOperator name="Contains"/>' +
        '<ogc:SpatialOperator name="Intersects"/>' +
        '<ogc:SpatialOperator name="Overlaps"/>' +
      '</ogc:SpatialOperators>' +
    '</ogc:Spatial_Capabilities>' +
    '<ogc:Temporal_Capabilities>' +
      '<ogc:TemporalOperands>' +
        '<ogc:TemporalOperand>gml:TimeInstant</ogc:TemporalOperand>' +
        '<ogc:TemporalOperand>gml:TimePeriod</ogc:TemporalOperand>' +
      '</ogc:TemporalOperands>' +
      '<ogc:TemporalOperators>' +
        '<ogc:TemporalOperator name="TM_During"/>' +
        '<ogc:TemporalOperator name="TM_Equals"/>' +
        '<ogc:TemporalOperator name="TM_After"/>' +
        '<ogc:TemporalOperator name="TM_Before"/>' +
      '</ogc:TemporalOperators>' +
    '</ogc:Temporal_Capabilities>' +
    '<ogc:Scalar_Capabilities>' +
      '<ogc:ComparisonOperators>' +
        '<ogc:ComparisonOperator>Between</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>EqualTo</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>NotEqualTo</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>LessThan</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>LessThanEqualTo</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>GreaterThan</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>GreaterThanEqualTo</ogc:ComparisonOperator>' +
        '<ogc:ComparisonOperator>Like</ogc:ComparisonOperator>' +
      '</ogc:ComparisonOperators>' +
    '</ogc:Scalar_Capabilities>' +
    '<ogc:Id_Capabilities>' +
      '<ogc:FID/>' +
      '<ogc:EID/>' +
    '</ogc:Id_Capabilities>' +
  '</sos:Filter_Capabilities>' +
  '<sos:Contents>' +
    '<sos:ObservationOfferingList>' +
      '<sos:ObservationOffering gml:id="ATMOSPHERIC_TEMPERATURE">' +
        '<gml:name>Temperature of the atmosphere</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-11-20T15:20:22+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::Temperature"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="RAIN_GAUGE">' +
        '<gml:name>Rain</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-11-20T15:35:22+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::Precipitation1Hour"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="WIND_DIRECTION">' +
        '<gml:name>Direction of the wind</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-11-20T15:20:22+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::WindDirection"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="WIND_SPEED">' +
        '<gml:name>Speed of the wind</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-11-20T15:20:22+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::WindSpeed"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="HUMIDITY">' +
        '<gml:name>Humidity of the atmosphere</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-02-14T11:03:02+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::RelativeHumidity"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="LUMINANCE">' +
        '<gml:name>Luminance</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-11-20T15:20:22+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::Luminance"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
      '<sos:ObservationOffering gml:id="ATMOSPHERIC_PRESSURE">' +
        '<gml:name>Pressure of the atmosphere</gml:name>' +
        '<gml:boundedBy>' +
          '<gml:Envelope srsName="urn:ogc:def:crs:EPSG:4326">' +
            '<gml:lowerCorner>46.611644 7.6103</gml:lowerCorner>' +
            '<gml:upperCorner>51.9412 13.883498</gml:upperCorner>' +
          '</gml:Envelope>' +
        '</gml:boundedBy>' +
        '<sos:time>' +
          '<gml:TimePeriod xsi:type="gml:TimePeriodType">' +
            '<gml:beginPosition>2008-12-20T02:29:27+01:00</gml:beginPosition>' +
            '<gml:endPosition>2009-11-04T14:45:00+01:00</gml:endPosition>' +
          '</gml:TimePeriod>' +
        '</sos:time>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:procedure xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:observedProperty xlink:href="urn:x-ogc:def:property:OGC::BarometricPressure"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:3d3b239f-7696-4864-9d07-15447eae2b93"/>' +
        '<sos:featureOfInterest xlink:href="urn:ogc:object:feature:OSIRIS-HWS:efeb807b-bd24-4128-a920-f6729bcdd111"/>' +
        '<sos:responseFormat>text/xml;subtype="om/1.0.0"</sos:responseFormat>' +
        '<sos:responseFormat>application/zip</sos:responseFormat>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Measurement</sos:resultModel>' +
        '<sos:resultModel xmlns:ns="http://www.opengis.net/om/1.0">ns:Observation</sos:resultModel>' +
        '<sos:responseMode>inline</sos:responseMode>' +
        '<sos:responseMode>resultTemplate</sos:responseMode>' +
      '</sos:ObservationOffering>' +
    '</sos:ObservationOfferingList>' +
  '</sos:Contents>' +
'</sos:Capabilities>'
);