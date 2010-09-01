/* Translators (2009 onwards):
 *  - Ferrer
 *  - Komzpa
 *  - Lockal
 *  - Александр Сигачёв
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["ru"]
 * Dictionary for Русский.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */
OpenLayers.Lang["ru"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Необработанный запрос вернул ${statusText}",

    'permalink': "Постоянная ссылка",

    'overlays': "Слои",

    'baseLayer': "Основной слой",

    'sameProjection': "Обзорная карта работает только тогда, когда имеет ту же проекцию, что и основная",

    'readNotImplemented': "Чтение не реализовано.",

    'writeNotImplemented': "Запись не реализована.",

    'noFID': "Невозможно обновить объект, для которого нет FID.",

    'errorLoadingGML': "Ошибка при загрузке файла GML ${url}",

    'browserNotSupported': "Ваш браузер не поддерживает векторную графику. На данный момент поддерживаются:\n${renderers}",

    'componentShouldBe': "addFeatures: компонент должен быть ${geomType}",

    'getFeatureError': "getFeatureFromEvent вызван для слоя без рендерера. Обычно это говорит о том, что вы уничтожили слой, но оставили связанный с ним обработчик.",

    'minZoomLevelError': "Свойство minZoomLevel предназначено только для использования со слоями, являющимися потомками FixedZoomLevels. То, что этот WFS-слой проверяется на minZoomLevel — реликт прошлого. Однако мы не можем удалить эту функцию, так как, возможно, от неё зависят некоторые основанные на OpenLayers приложения. Функция объявлена устаревшей — проверка minZoomLevel будет удалена в 3.0. Пожалуйста, используйте вместо неё настройку мин/макс разрешения, описанную здесь: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Транзакция WFS: УСПЕШНО ${response}",

    'commitFailed': "Транзакция WFS: ОШИБКА ${response}",

    'googleWarning': "Слой Google не удалось нормально загрузить.\x3cbr\x3e\x3cbr\x3eЧтобы избавиться от этого сообщения, выбите другой основной слой в переключателе в правом верхнем углу.\x3cbr\x3e\x3cbr\x3eСкорее всего, причина в том, что библиотека Google Maps не была включена или не содержит корректного API-ключа для вашего сайта.\x3cbr\x3e\x3cbr\x3eРазработчикам: чтобы узнать, как сделать, чтобы всё заработало, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3eщёлкните тут\x3c/a\x3e",

    'getLayerWarning': "Слой ${layerType} не удалось нормально загрузить. \x3cbr\x3e\x3cbr\x3eЧтобы избавиться от этого сообщения, выбите другой основной слой в переключателе в правом верхнем углу.\x3cbr\x3e\x3cbr\x3eСкорее всего, причина в том, что библиотека ${layerLib} не была включена или была включена некорректно.\x3cbr\x3e\x3cbr\x3eРазработчикам: чтобы узнать, как сделать, чтобы всё заработало, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eщёлкните тут\x3c/a\x3e",

    'scale': "Масштаб = 1 : ${scaleDenom}",

    'W': "З",

    'E': "В",

    'N': "С",

    'S': "Ю",

    'layerAlreadyAdded': "Вы попытались добавить слой «${layerName}» на карту, но он уже был добавлен",

    'reprojectDeprecated': "Вы используете опцию \'reproject\' для слоя ${layerName}. Эта опция является устаревшей: ее использование предполагалось для поддержки показа данных поверх коммерческих базовых карт, но теперь этот функционал несёт встроенная поддержка сферической проекции Меркатора. Больше сведений доступно на http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Этот метод считается устаревшим и будет удалён в версии 3.0. Пожалуйста, пользуйтесь ${newMethod}.",

    'boundsAddError': "Функции add надо передавать оба значения, x и y.",

    'lonlatAddError': "Функции add надо передавать оба значения, lon и lat.",

    'pixelAddError': "Функции add надо передавать оба значения, x и y.",

    'unsupportedGeometryType': "Неподдерживаемый тип геометрии: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition failed: элемент с id ${elemId} может находиться не в нужном месте.",

    'filterEvaluateNotImplemented': "evaluate не реализовано для фильтра данного типа."

});
