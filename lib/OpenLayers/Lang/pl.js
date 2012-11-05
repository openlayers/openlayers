/* Translators:
 *  - Arkadiusz Grabka
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["pl"]
 * Dictionary for Polish.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["pl"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Nieobsługiwane żądanie zwróciło ${statusText}",

    'Permalink': "Permalink",

    'Overlays': "Nakładki",

    'Base Layer': "Warstwa podstawowa",

    'noFID': "Nie można zaktualizować funkcji, dla których nie ma FID.",

    'browserNotSupported':
        "Twoja przeglądarka nie obsługuje renderowania wektorów. Obecnie obsługiwane renderowanie to:\n${renderers}",

    // console message
    'minZoomLevelError':
        "Właściwość minZoomLevel jest przeznaczona tylko do użytku " +
        "z warstwami FixedZoomLevels-descendent." +
        "Warstwa wfs, która sprawdza minZoomLevel jest reliktem przeszłości." +
        "Nie możemy jej jednak usunąc bez mozliwości łamania OL aplikacji, " +
        "które mogą być od niej zależne. " +
        "Dlatego jesteśmy za deprecjację -- minZoomLevel " +
        "zostanie usunięta w wersji 3.0. W zamian prosze użyj " +
        "min/max rozdzielczości w sposób opisany tutaj: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transakcja WFS: SUKCES ${response}",

    'commitFailed': "Transakcja WFS: FAILED ${response}",

    'googleWarning':
        "Warstwa Google nie był w stanie załadować się poprawnie.<br><br>" +
        "Aby pozbyć się tej wiadomości, wybierz nową Warstwe podstawową " +
        "w przełączniku warstw w górnym prawym rogu mapy.<br><br>" +
        "Najprawdopodobniej jest to spowodowane tym, że biblioteka Google Maps " +
        "nie jest załadowana, lub nie zawiera poprawnego klucza do API dla twojej strony<br><br>" +
        "Programisto: Aby uzyskać pomoc , " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>kliknij tutaj</a>",

    'getLayerWarning':
        "Warstwa ${layerType} nie mogła zostać załadowana poprawnie.<br><br>" +
        "Aby pozbyć się tej wiadomości, wybierz nową Warstwe podstawową " +
        "w przełączniku warstw w górnym prawym rogu mapy.<br><br>" +
        "Najprawdopodobniej jest to spowodowane tym, że biblioteka ${layerLib} " +
        "nie jest załadowana, lub może(o ile biblioteka tego wymaga) " +
        "byc potrzebny klucza do API dla twojej strony<br><br>" +
        "Programisto: Aby uzyskać pomoc , " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>kliknij tutaj</a>",

    'Scale = 1 : ${scaleDenom}': "Skala = 1 : ${scaleDenom}",
    
    //labels for the graticule control
    'W': 'ZACH',
    'E': 'WSCH',
    'N': 'PN',
    'S': 'PD',
    'Graticule': 'Siatka',

    // console message
    'reprojectDeprecated':
        "w warstwie ${layerName} używasz opcji 'reproject'. " +
        "Ta opcja jest przestarzała: " +
        "jej zastosowanie został zaprojektowany, aby wspierać wyświetlania danych przez komercyjne mapy, "+
        "jednak obecnie ta funkcjonalność powinien zostać osiągnięty za pomocą Spherical Mercator " +
        "its use was designed to support displaying data over commercial. Więcje informacji na ten temat możesz znaleźć na stronie " + 
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Ta metoda jest przestarzała i będzie usunięta od wersji 3.0. " +
        "W zamian użyj ${newMethod}."
});