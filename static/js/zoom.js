/**
 * This file is used to handle the zoom in/out
 */


/**
 * The initial zoom scale = 10;
 * The available zoom range is [4, 13]
 * zoom in:
 *  when zoom = 11, the stop and charging station appear
 *  when zoom = 12, the BEBs can appear, but if you double click on route when zoom <= 11, it will set to zoom = 12
 * zoom out:
 *  when you have BEBs, zoom < 12, the BEB will disappear, when zoom<11, the charging stations and stops will disappear.
 * zoom out first, then zoom in:
 *  when you have BEBs, then these BEB will disappear once again
 */

/**
 * when zoom change, zoom = 11,stop and charging appear, when zoom < 10, they disappear
 * when zoom in the scale of stop and charging station change
 * biggest zoom is 13, samllest zoom is 6
 */
 function zoomChangeHandler(map){
    let curZoom = map.getZoom();
   
    // when zoom = 11, stop and charging station appear if there are BEBs, BEBs disappear
    if(curZoom == 11){
      for(let i = 0; i < stopMakers.length; i++){
        stopMakers[i].setRadius(stopMakerRadius);
        stopMakers[i].setMap(map);
      }
      for(let i = 0; i < chargingStationMakers.length; i++){
        curChargingStationMakers = chargingStationMakers[i]['maker'];
        let curIcon = curChargingStationMakers.getIcon();
        curIcon['scale'] = chargingStationMakerScale;
        curChargingStationMakers.setIcon(curIcon);
        curChargingStationMakers.setMap(map);  
      }
      BEBsDisappear();
    }

    // stop and charging station disappear
    if(curZoom == 10){
      for(let i = 0; i < stopMakers.length; i++){
        stopMakers[i].setMap(null);
      }
      for(let i = 0; i < chargingStationMakers.length; i++){
        chargingStationMakers[i]['maker'].setMap(null);
      }
    }

    if(curZoom == 12){
        BEBsAppear();
    }

    // stop and charging station zoom
    if(curZoom > 10.9999 && curZoom < 13.0000001){
      for(let i = 0; i < stopMakers.length; i++){
        stopMakers[i].setRadius(stopMakerRadius * Math.pow((11/curZoom), 4));
        stopMakers[i].setMap(map);
      }
      for(let i = 0; i < chargingStationMakers.length; i++){
        curChargingStationMakers = chargingStationMakers[i]['maker'];
        let curIcon = curChargingStationMakers.getIcon();
        curIcon['scale'] = chargingStationMakerScale * Math.pow((curZoom/11), 4);
        curChargingStationMakers.setIcon(curIcon);
        curChargingStationMakers.setMap(map);  
      }
    }
  
  }
  
  