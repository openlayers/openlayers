/* Translators (2009 onwards):
 *  - Sannab
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["sv"]
 * Dictionary for Svenska.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["sv"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Ej hanterad fråga retur ${statusText}",

    'permalink': "Permalänk",

    'overlays': "Kartlager",

    'baseLayer': "Bakgrundskarta",

    'sameProjection': "Översiktskartan fungerar endast när den har samma projektion som huvudkartan",

    'readNotImplemented': "Läsning ej implementerad.",

    'writeNotImplemented': "Skrivning ej implementerad.",

    'noFID': "Kan ej uppdatera feature (objekt) för vilket FID saknas.",

    'errorLoadingGML': "Fel i laddning av GML-fil ${url}",

    'browserNotSupported': "Din webbläsare stöder inte vektorvisning. För närvarande stöds följande visning:\n${renderers}",

    'componentShouldBe': "addFeatures : komponenten skall vara en ${geomType}",

    'getFeatureError': "getFeatureFromEvent anropad för lager utan utritning. Detta betyder oftast att man raderat ett lager, men inte en hanterare som är knuten till lagret.",

    'minZoomLevelError': "Egenskapen minZoomLevel är endast avsedd att användas med lager med FixedZoomLevels. Att detta WFS-lager kontrollerar minZoomLevel är en relik från äldre versioner. Vi kan dock inte ta bort det utan att riskera att OL-baserade tillämpningar som använder detta slutar fungera. Därför är det satt som deprecated, minZoomLevel kommer att tas bort i version 3.0. Använd i stället inställning av min/max resolution som beskrivs här: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS-transaktion: LYCKADES ${response}",

    'commitFailed': "WFS-transaktion: MISSLYCKADES ${response}",

    'googleWarning': "Google-lagret kunde inte laddas korrekt.\x3cbr\x3e\x3cbr\x3eFör att slippa detta meddelande, välj en annan bakgrundskarta i lagerväljaren i övre högra hörnet.\x3cbr\x3e\x3cbr\x3eSannolikt beror felet på att Google Maps-biblioteket inte är inkluderat på webbsidan eller på att sidan inte anger korrekt API-nyckel för webbplatsen.\x3cbr\x3e\x3cbr\x3eUtvecklare: hjälp för att åtgärda detta, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eklicka här\x3c/a\x3e.",

    'getLayerWarning': "${layerType}-lagret kunde inte laddas korrekt.\x3cbr\x3e\x3cbr\x3eFör att slippa detta meddelande, välj en annan bakgrundskarta i lagerväljaren i övre högra hörnet.\x3cbr\x3e\x3cbr\x3eSannolikt beror felet på att ${layerLib}-biblioteket inte är inkluderat på webbsidan.\x3cbr\x3e\x3cbr\x3eUtvecklare: hjälp för att åtgärda detta, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eklicka här\x3c/a\x3e.",

    'scale': "\x3cstrong\x3eSkala\x3c/strong\x3e 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Du försökte lägga till lagret: ${layerName} på kartan, men det har lagts till tidigare",

    'reprojectDeprecated': "Du använder inställningen \'reproject\' på lagret ${layerName}. Denna inställning markerad som deprecated: den var avsedd att användas för att stödja visning av kartdata på kommersiella bakgrundskartor, men nu bör man i stället använda Spherical Mercator-stöd för den funktionaliteten. Mer information finns på http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Denna metod är markerad som deprecated och kommer att tas bort i 3.0. Använd ${newMethod} i stället.",

    'boundsAddError': "Du måste skicka både x- och y-värde till funktionen add.",

    'lonlatAddError': "Du måste skicka både lon- och lat-värde till funktionen add.",

    'pixelAddError': "Du måste skicka både x- och y-värde till funktionen add.",

    'unsupportedGeometryType': "Stöd saknas för geometritypen: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition misslyckades: elementet med id ${elemId} kan placeras fel.",

    'filterEvaluateNotImplemented': "evaluering har ej implementerats för denna typ av filter."

});
