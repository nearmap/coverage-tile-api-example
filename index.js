import 'ol/ol.css';
import 'ol-popup/src/ol-popup.css';
import 'ol-geocoder/dist/ol-geocoder.css';
import Geocoder from 'ol-geocoder';
import {toStringHDMS} from 'ol/coordinate';
import { transform } from 'ol/proj';
import Popup from 'ol-popup';
import {initMap} from './surveyPicker';


const map = initMap();
const popup = new Popup();
const geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  key: '__some_key__',
  lang: 'en-AU',
  placeholder: 'Search for ...',
  autocomplete: true,
  autoCompleteMinLength: 3,
  targetType: 'text-input',
  limit: 5,
  keepOpen: true
});
map.addControl(geocoder);
map.addOverlay(popup);
map.on('singleclick', function(evt) {
  const prettyCoord = toStringHDMS(transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'), 2);
  popup.show(evt.coordinate, '<div><h2>Coordinates</h2><p>' + prettyCoord + '</p></div>');
});