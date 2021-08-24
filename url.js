import * as constants from './config';

/**
 * Documentation for this Nearmap API:
 * https://docs.nearmap.com/display/ND/Tile+API
 */
 export function urlTemplate(z, x, y, survey, layer) {
    var until = '';
    if (survey) {
        until = '&until=' + survey;
    }

    return 'https://api.nearmap.com/tiles/v3/' +
        layer + '/' + z + '/' + x + '/' + y +
        '.img?tertiary=satellite&apikey=' + constants.DEMO_API_KEY + until;
};
  
/**
 *  Documentation for this Nearmap API:
 *  https://docs.nearmap.com/display/ND/Coverage+API
 */
export function coverageUrlTemplate(east, west, north, south) {
    return 'https://api.nearmap.com/coverage/v2/poly/' +
      west + ',' + north + ',' +
      east + ',' + north + ',' +
      east + ',' + south + ',' +
      west + ',' + south + ',' +
      west + ',' + north +
      '?apikey=' + constants.DEMO_API_KEY +
      '&limit=1000';
}