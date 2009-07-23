/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/* Translators (2009 onwards):
 *  - Ferrer
 *  - Александр Сигачёв
 *  - Lockal
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

    'unhandledRequest': "Неподдерживамый запрос вернул ${statusText}",

    'permalink': "Постоянная ссылка",

    'overlays': "Оверлеи",

    'baseLayer': "Базовый слой",

    'sameProjection': "Обзорная карта работает только если она использует ту же проекцию, что и основная карта",

    'readNotImplemented': "Чтение не выполняется.",

    'writeNotImplemented': "Запись не выполняется.",

    'noFID': "Не удаётся обновить функцию, для которой нет FID.",

    'errorLoadingGML': "Ошибка при загрузке файла GML ${url}",

    'browserNotSupported': "Ваш браузер не поддерживает векторные изображения. В настоящее поддерживают работу с векторами:\n${renderers}",

    'componentShouldBe': "addFeatures: компонент должен быть ${geomType}",

    'getFeatureError': "getFeatureFromEvent была вызван из слоя, без рендерера. Обычно это означает, что вы уничтожили слой, а не какой-то связанный с ним обработчик.",

    'commitSuccess': "Транзакция WFS: Успешно ${response}",

    'commitFailed': "Транзакция WFS: Не удалось ${response}",

    'getLayerWarning': "Слой ${layerType} не удалось правильно загрузить.\x3cbr\x3e\x3cbr\x3eЧтобы избавиться от этого сообщения, выберите новый БазовыйСлой в переключателе слоёв в верхнем правом углу.\x3cbr\x3e\x3cbr\x3eСкорее всего, это произолшо из-за того, что библиотека скрипта ${layerLib} некорректно включена.\x3cbr\x3e\x3cbr\x3eДля разработчиков: см. \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3eвики\x3c/a\x3e для получения помощи о правильной работе.",

    'scale': "Масштаб = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Вы попытались добавить слой «${layerName}» на карту, но он уже был добавлен",

    'methodDeprecated': "Этот метод не рекомендуется использовать и будет удалён в версии 3.0. Пожалуйста, используйте ${newMethod}.",

    'boundsAddError': "Вы должны передать одновременно значения x и y для функции добавления.",

    'lonlatAddError': "Вы должны передать одновременно значения lon и lat для функции добавления.",

    'pixelAddError': "Вы должны передать одновременно значения x и y для функции добавления.",

    'unsupportedGeometryType': "Неподдерживаемый геометрический тип: ${geomType}",

    'pagePositionFailed': "OpenLayers.Util.pagePosition не удалось: элемент с id ${elemId} может быть перемещён.",

    'filterEvaluateNotImplemented': "«evaluate» не выполнено для этого типа фильтра.",

};
