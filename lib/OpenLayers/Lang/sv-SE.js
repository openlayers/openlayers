/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["sv-SE"]
 * Dictionary for swedish (Sweden).  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["sv-SE"] = {

    'unhandledRequest': "Ej hanterad fråga retur ${statusText}",

    'permalink': "Permalänk",

    'overlays': "Kartlager",

    'baseLayer': "Bakgrundskarta",

    'sameProjection':
        "Översiktskartan fungerar endast när den har samma projektion som huvudkartan",

    'readNotImplemented': "Läsning ej implementerad.",

    'writeNotImplemented': "Skrivning ej implementerad.",

    'noFID': "Kan ej uppdatera feature (objekt) för vilket FID saknas.",

    'errorLoadingGML': "Fel i laddning av GML-fil ${url}",

    'browserNotSupported':
        "Din webbläsare stöder inte vektorvisning. För närvarande stöds följande visning:\n${renderers}",

    'componentShouldBe': "addFeatures : komponenten skall vara en ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent anropad för lager utan utritning. Detta betyder oftast att man " +
        "raderat ett lager, men inte en hanterare som är knuten till lagret.",

    // console message
    'minZoomLevelError':
        "Egenskapen minZoomLevel är endast avsedd att användas " +
        "med lager med FixedZoomLevels. Att detta WFS-lager " +
        "kontrollerar minZoomLevel är en relik från äldre versioner. " +
        "Vi kan dock inte ta bort det utan att riskera att " +
        "OL-baserade tillämpningar som använder detta slutar " +
        "fungera. Därför är det satt som deprecated, minZoomLevel " +
        "kommer att tas bort i version 3.0. Använd i stället " +
        "inställning av min/max resolution som beskrivs här: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transaktion: LYCKADES ${response}",

    'commitFailed': "WFS-transaktion: MISSLYCKADES ${response}",

    'googleWarning':
        "Google-lagret kunde inte laddas korrekt.<br><br>" + 
        "För att slippa detta meddelande, välj en annan bakgrundskarta " +
        "i lagerväljaren i övre högra hörnet.<br><br>" +
        "Sannolikt beror felet på att Google Maps-biblioteket " + 
        "inte är inkluderat på webbsidan eller på att sidan " +
        "inte anger korrekt API-nyckel för webbplatsen.<br><br>" +
        "Utvecklare: hjälp för att åtgärda detta, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>klicka här</a>.",

    'getLayerWarning':
        "${layerType}-lagret kunde inte laddas korrekt.<br><br>" + 
        "För att slippa detta meddelande, välj en annan bakgrundskarta " +
        "i lagerväljaren i övre högra hörnet.<br><br>" +
        "Sannolikt beror felet på att ${layerLib}-biblioteket " + 
        "inte är inkluderat på webbsidan.<br><br>" +
        "Utvecklare: hjälp för att åtgärda detta, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>klicka här</a>.",

    'scale': "<strong>Skala</strong> 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Du försökte lägga till lagret: ${layerName} på kartan, men det har lagts till tidigare",

    // console message
    'reprojectDeprecated':
        "Du använder inställningen 'reproject' på lagret ${layerName}. " +
        "Denna inställning markerad som deprecated: den var avsedd " +
        "att användas för att stödja visning av kartdata på kommersiella " +
        "bakgrundskartor, men nu bör man i stället " +
        "använda Spherical Mercator-stöd för den funktionaliteten. " +
        "Mer information finns " +   
        "på http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Denna metod är markerad som deprecated och kommer att tas bort i 3.0. " +
        "Använd ${newMethod} i stället.",

    // console message
    'boundsAddError': "Du måste skicka både x- och y-värde till funktionen add.",

    // console message
    'lonlatAddError': "Du måste skicka både lon- och lat-värde till funktionen add.",

    // console message
    'pixelAddError': "Du måste skicka både x- och y-värde till funktionen add.",

    // console message
    'unsupportedGeometryType': "Stöd saknas för geometritypen: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition misslyckades: elementet med id ${elemId} kan placeras fel.",
                    
    'end': ''
};
