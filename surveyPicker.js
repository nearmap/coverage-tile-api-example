import * as constants from './config';
import { urlTemplate, coverageUrlTemplate } from './url';
import {Map, View} from 'ol';
import { fromLonLat, get, transformExtent } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from  'ol/source/XYZ';
import Zoom from 'ol/control/Zoom';

export const layerType = 'Vert';
export let availableSurveys = [];
export let olMap = null;
export let dropdownElement = null;
export let selectedDisplayElement = null;
export let displayedDisplayElement = null;

export const selectedSurvey = {
    survey: null,
    get value() {
      return this.survey;
    },
    set value(value) {
      this.survey = value;
      selectedDisplayElement.innerHTML = value;
    }
};

export const displayedSurvey = {
    survey: null,
    get value() {
        return this.survey;
    },
    set value(value) {
        this.survey = value;
        displayedDisplayElement.innerHTML = value;
    }
};

export function createLayer() {
    return new TileLayer({
      source: new XYZ({
        tileSize: [256, 256],
        tileUrlFunction: tileUrlFunction,
        tileLoadFunction: tileLoadFunction
      })
    });
}

export function createView(zoom, center) {
    zoom = zoom || constants.ZOOM;
    center = center || constants.CENTER;
  
    return new View({
      center: fromLonLat(center),
      minZoom: constants.MIN_ZOOM,
      maxZoom: constants.MAX_ZOOM,
      zoom: zoom
    });
}

/**
 * Called when the selected survey date does not exist in the current list of available survey dates.
 * It returns the closest available date.
 *
 * @param {*} surveys            available surveys returned by the coverage API
 * @param {*} selectedDate       user's selected survey date
 */
export function findClosestDate(surveys, selectedDate) {
    const selectedDateInMs = selectedDate ? +new Date(selectedDate) : +new Date();
    const deltaInMs = surveys.map(function(survey) {
        const surveyDateInMs = +new Date(survey.captureDate);
        return Math.abs(selectedDateInMs - surveyDateInMs);
    });

    const closestDateInMs = Math.min.apply(null, deltaInMs);
    return surveys[deltaInMs.findIndex(function(ms) { return ms === closestDateInMs; })].captureDate;
};
  
/**
 * @param {*} availableSurveys    available surveys returned by the coverage API
 * @param {*} selectedDate        user's selected survey date
 */
export function getSurveyDate(availableSurveys, selectedDate) {
// No dates available
    if (availableSurveys.length === 0) {
        return null;
    }

    // Selects the selected survey date when available
    if (availableSurveys.find(function(survey) { return selectedDate === survey.captureDate; })) {
        return selectedDate;
    }

    // Searches for the closest available survey date when not available
    return findClosestDate(availableSurveys, selectedDate);
}

/**
 * Provides Nearmap tile URL whenever for selected survey date and layer type
 */
export function tileUrlFunction(tileCoord) {
    var z = tileCoord[0];
    var x = tileCoord[1];
    var y = tileCoord[2];
  
    return urlTemplate(z, x, y, displayedSurvey.value, layerType);
}

/**
 * Provides Nearmap tile rotation mechanism
 */
export function tileLoadFunction(imageTile, src) {
    var img = imageTile.getImage();
    fetchImageData(src)
        .then(function(imgData) {
        img.src = imgData || '';
    });
}

export async function fetchImageData(url) {
    try {
        const resp = await fetch(url, { redirect: 'manual' });
        if (resp.status === 200) {
            return resp.blob()
                .then(function (data) {
                    return window.URL.createObjectURL(data);
                });
        }
        return await null;
    } catch (reason) {
        return null;
    }
}

/**
 * Calculates view bounds [minX, minY, maxX, maxY] for Nearmap coverage API.
 * Above coordinates are internally called [west, south, east, north].
 */
export function getBounds() {
    var view = olMap.getView();
    var projection = view.getProjection();
    var extent = view.calculateExtent(olMap.getSize());
    var extent = transformExtent(extent, projection, get('EPSG:4326'));
    var west = extent[0];
    var south = extent[1];
    var east = extent[2];
    var north = extent[3];
  
    return { north: north, east: east, west: west, south: south };
};

/**
 * Fetches Nearmap coverage API.
 */
export async function fetchCoverage() {
    var bounds = getBounds();
    var coverageUrl = coverageUrlTemplate(bounds.east, bounds.west, bounds.north, bounds.south);

    const response = await fetch(coverageUrl);
    return await response.json();
}

/**
 * updateSurveys contains logics how to deal with coverage api while map is moving
 */
export async function updateSurveys() {
    // Fetches Nearmap coverage API based current view port
    const response = await fetchCoverage();
    // Updates internal `availableSurveys` and `displayedSurvey` members
    availableSurveys = getAvailableSurveyDates(response);
    displayedSurvey.value = getSurveyDate(availableSurveys, selectedSurvey.value);
    // Updates available surveys dropdown options
    updateDropDown();
}

/**
 * Displays all available survey dates in a dropdown.
 */
export function updateDropDown() {
    // Clears up previous options
    dropdownElement.innerHTML = '';
  
    // Creates the content of options for select element
    availableSurveys.forEach(function(survey) {
      var optionElement = document.createElement('option');
      optionElement.setAttribute('value', survey.captureDate);
      optionElement.innerText = survey.captureDate;
  
      dropdownElement.add(optionElement);
    });
  
    // Assigns default select value
    dropdownElement.value = displayedSurvey.value;
}

/**
 * Extracts out surveys which contain corresponding tile type 
 * 
 * e.g
 *  resources:
 *    tiles:
 *      0: {id: "100-24daeea2-b95e-11e7-b260-63f23522198a", scale: 21, type: "South"}
 *      1: {id: "100-24dd2c4e-b95e-11e7-b262-7fb6c449b1f8", scale: 20, type: "West"}
 *      2: {id: "100-24d9cb12-b95e-11e7-b25f-9be25dc20646", scale: 21, type: "North"}
 *      3: {id: "100-24cf92b4-b95e-11e7-b25d-5fce962b39a4", scale: 21, type: "Vert"}
 *      4: {id: "100-24dc01fc-b95e-11e7-b261-4395884423ee", scale: 20, type: "East"}
 */
export function getAvailableSurveyDates(response) {
    var surveys = response && response.surveys ? response.surveys : [];
  
    return surveys.filter(function(survey) {
      return (survey.resources.tiles || [])
        .some(function(tile) { return tile.type === layerType; });
    });
}

export function onMapMoveHandler() {
    updateSurveys();
}

export function initUiElements() {
    dropdownElement = document.querySelector('select');
    selectedDisplayElement = document.querySelector('#selectedSurveyElementId');
    displayedDisplayElement = document.querySelector('#displayedSurveyElementId');
}

export function addEventListeners() {
    // Adds map moving (panning and zooming) listener
    olMap.on('moveend', function() {
        onMapMoveHandler(dropdownElement);
    });

    // Adds "onChange" listener to the dropdown
    dropdownElement.addEventListener('change', function(evt) {
        selectedSurvey.value = evt.target.value;
        displayedSurvey.value = evt.target.value;

        refreshTiles();
    });
}

export function refreshTiles() {
    olMap
      .getLayers()
      .item(0)
      .getSource()
      .refresh();
}

export function initMap() {
    olMap = new Map({
      target: 'map',
      controls: [new Zoom()],
      layers: [createLayer()],
      view: createView()
    });
  
    initUiElements();
    addEventListeners();

    return olMap;
}
