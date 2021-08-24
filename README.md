# coverage-tile-api-example
As part of Navig8 2021, we wanted show how to go beyond MapBrowser and utilise the Tile and Coverage Nearmap APIs to build an interactive application. This application also uses a geocoding API to show one might build address geocoding.

## Introduction
This application uses the following APIs:
* Nearmap Coverage API - specifically the version that [retrieves metadata for a given polygon](https://docs.nearmap.com/display/ND/Coverage+API#CoverageAPI-RetrieveMetadataforaGivenPolygon)
* [Nearmap Tile API](https://docs.nearmap.com/display/ND/Tile+API)
* Geocoding using the [ol-geocoder package](https://github.com/jonataswalker/ol-geocoder) using the [Nominatim.org geocoder](https://nominatim.org/)

The application also shows the lat, long for each point on click on a popup.

## How to run
* `npm install`
* `npm start`
