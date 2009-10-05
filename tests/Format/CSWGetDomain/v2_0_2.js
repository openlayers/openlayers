var csw_request = 
'<csw:GetDomain xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="2.0.2">' +
  '<csw:PropertyName>type</csw:PropertyName>' +
'</csw:GetDomain>';

var csw_response = 
'<?xml version="1.0" encoding="UTF-8"?>' +
'<csw:GetDomainResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2">' +
  '<csw:DomainValues type="csw:Record">' +
    '<csw:PropertyName>type</csw:PropertyName>' +
    '<csw:ListOfValues>' +
      '<csw:Value my_attr="my_value">dataset</csw:Value>' +
      '<csw:Value>service</csw:Value>' +
    '</csw:ListOfValues>' +
  '</csw:DomainValues>' +
'</csw:GetDomainResponse>'
;

