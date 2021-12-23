/**
 * This script is used to handle BEB rendering, BEB update, and BEB events
 */

/**
 * render new BEBs (when selected a route)
 * @param {*} BEBs   [{'blockId': , 'ratio': , 'coordinates': , 'battery': , 'opacity': , 'seq_miss': true/false}...]
 */
function renderBEBMaker(BEBs){
    for(let i = 0; i < BEBs.length; i++){
        let BEBCoords = BEBs[i]['coordinates'];
        let opacity = BEBs[i]['opacity'];
        let seq_miss = BEBs[i]['seq_miss'];
        let blockId = BEBs[i]['blockId']
        let BEBIcon;

        // render new BEB
        if(seq_miss){
            BEBIcon = {
                path: "M488 128h-8V80c0-44.8-99.2-80-224-80S32 35.2 32 80v48h-8c-13.25 0-24 10.74-24 24v80c0 13.25 10.75 24 24 24h8v160c0 17.67 14.33 32 32 32v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h192v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h6.4c16 0 25.6-12.8 25.6-25.6V256h8c13.25 0 24-10.75 24-24v-80c0-13.26-10.75-24-24-24zM112 400c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm16-112c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h256c17.67 0 32 14.33 32 32v128c0 17.67-14.33 32-32 32H128zm272 112c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z",
                fillColor: 'black',  // #004C7B
                fillOpacity: 0.6,
                strokeWeight: 0,
                rotation: 0,
                scale: 0.033,
                zIndex: 5,
                anchor: new google.maps.Point(275, 216),
                };
        }
        else{
            BEBIcon = {
                path: "M488 128h-8V80c0-44.8-99.2-80-224-80S32 35.2 32 80v48h-8c-13.25 0-24 10.74-24 24v80c0 13.25 10.75 24 24 24h8v160c0 17.67 14.33 32 32 32v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h192v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h6.4c16 0 25.6-12.8 25.6-25.6V256h8c13.25 0 24-10.75 24-24v-80c0-13.26-10.75-24-24-24zM112 400c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm16-112c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h256c17.67 0 32 14.33 32 32v128c0 17.67-14.33 32-32 32H128zm272 112c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z",
                fillColor: '#2B5F5D',  // #004C7B
                fillOpacity: opacity,
                strokeWeight: 0,
                rotation: 0,
                scale: 0.033,
                zIndex: 5,
                anchor: new google.maps.Point(275, 216),
                };
        }
            
        let BEBMarker = new google.maps.Marker({
          position: {lat: BEBCoords['lat'], lng: BEBCoords['lng']},
          icon: BEBIcon,
          map,
        });
  
        let flag;   // distinguish the BEBs
        // single click
        BEBMarker.addListener("click", () => {
          flag = 0;
          update_timeout = setTimeout(function(){
            if(flag == 0){
                // you need not to restore the selected routes
                // restoreClkRoute();
                console.log('click BEBMarker');
                restoreClkRoute();
                BEBMarkerClick(BEBMarker, map, blockId);
            }
          }, 300);
        });

        // double click
        BEBMarker.addListener("dblclick", () => {
            flag = 1;
            restoreClkRoute();
            BEBMarkerdblClick(BEBMarker, map, blockId);
        });


        BEBMakers[blockId] = {'maker': BEBMarker};
    }
}

/**
 * delete the BEBs
 * @param {}} BEBs 
 */
function delBEBMaker(BEBs){
    for(let i = 0; i < BEBs.length; i++){
        let blockId = BEBs[i]['blockId'];
        BEBMakers[blockId]['maker'].setMap(null);
        delete BEBMakers[blockId];
    }   
}

/**
 * update BEB Maker when time changes
 * when time changes, we need to call this method
 * @param {*} BEBs  
 * [{'blockId': , 'ratio': , 'coordinates': , 'battery': , 'opacity': , 'seq_miss': true/false}...]
 * BEBMakers {'blockId': {'maker': }, ....} 
 */
 function updateBEBMaker(BEBs){
    // check the BEBMakers, 
    // get all block_ids
    let all_block_ids = [];
    for(let i = 0; i < BEBs.length; i++){
        all_block_ids.push(BEBs[i]['blockId']);
    }

    // delete some disappeared buses
    for(let key in BEBMakers){
        if(!(all_block_ids.indexOf(key) > -1)){
            //delete this element
            BEBMakers[key]['maker'].setMap(null);
            delete BEBMakers[key];
        }
    }

    // for buses still in the BEBMakers, change the location and the opacity, for not in BEBMakers, add a new one
    for(let i = 0; i < BEBs.length; i++){
        let blockId = BEBs[i]['blockId'];
        let BEBCoords = BEBs[i]['coordinates'];
        let opacity = BEBs[i]['opacity'];
        let seq_miss = BEBs[i]['seq_miss'];
        let BEBIcon;

        // check if there are new BEBs
        if(BEBMakers.hasOwnProperty(blockId)){
            // old BEBs, change the locations and color of the BEB icon
            let BEBMaker = BEBMakers[blockId]['maker'];
            let BEBIcon = BEBMaker.getIcon(); 
            BEBIcon['fillOpacity'] = opacity;
            BEBMaker.setIcon(BEBIcon);
            BEBMaker.setPosition({lat: BEBCoords['lat'], lng: BEBCoords['lng']});
        }
        else{
            // render new BEB
            if(seq_miss){
                BEBIcon = {
                    path: "M488 128h-8V80c0-44.8-99.2-80-224-80S32 35.2 32 80v48h-8c-13.25 0-24 10.74-24 24v80c0 13.25 10.75 24 24 24h8v160c0 17.67 14.33 32 32 32v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h192v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h6.4c16 0 25.6-12.8 25.6-25.6V256h8c13.25 0 24-10.75 24-24v-80c0-13.26-10.75-24-24-24zM112 400c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm16-112c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h256c17.67 0 32 14.33 32 32v128c0 17.67-14.33 32-32 32H128zm272 112c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z",
                    fillColor: 'black',  // #004C7B
                    fillOpacity: 0.6,
                    strokeWeight: 0,
                    rotation: 0,
                    scale: 0.033,
                    zIndex: 5,
                    anchor: new google.maps.Point(275, 216),
                    };
            }
            else{
                BEBIcon = {
                    path: "M488 128h-8V80c0-44.8-99.2-80-224-80S32 35.2 32 80v48h-8c-13.25 0-24 10.74-24 24v80c0 13.25 10.75 24 24 24h8v160c0 17.67 14.33 32 32 32v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h192v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h6.4c16 0 25.6-12.8 25.6-25.6V256h8c13.25 0 24-10.75 24-24v-80c0-13.26-10.75-24-24-24zM112 400c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm16-112c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h256c17.67 0 32 14.33 32 32v128c0 17.67-14.33 32-32 32H128zm272 112c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z",
                    fillColor: '#2B5F5D',  // #004C7B
                    fillOpacity: opacity,
                    strokeWeight: 0,
                    rotation: 0,
                    scale: 0.033,
                    zIndex: 5,
                    anchor: new google.maps.Point(275, 216),
                    };
            }
                
            let BEBMarker = new google.maps.Marker({
            position: {lat: BEBCoords['lat'], lng: BEBCoords['lng']},
            icon: BEBIcon,
            map,
            });
            
            let flag;   // distinguish the BEBs
            // single click
            BEBMarker.addListener("click", () => {
            flag = 0;
            update_timeout = setTimeout(function(){
                if(flag == 0){
                    // you need not to restore the selected routes
                    // restoreClkRoute();
                    console.log('click BEBMarker');
                    restoreClkRoute();
                    BEBMarkerClick(BEBMarker, map, blockId);
                }
            }, 300);
            });

            // double click
            BEBMarker.addListener("dblclick", () => {
                flag = 1;
                restoreClkRoute();
                BEBMarkerdblClick(BEBMarker, map, blockId);
            });

            BEBMakers[blockId] = {'maker': BEBMarker};
        }
    }
  }
  
  /**
   * events triggered by clicking on the BEB maker
   * @param {*} BEBMaker
   * @param {*} map map
   *  {'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': }
   */
  function BEBMarkerClick(BEBMaker, map, blockId){
    infoWindow.close();

    axios.post('/eleClick', {type: 'BEB', id: blockId}).then(function(result){
        data = result.data
        seq_miss = data['seq_miss']

        let contentStr = '';
        if(seq_miss){
            contentStr = '<p>Id: '+ result.data['BEBId']+ '<br/> Direction:'+ data['direction'] + '<br/> Time to next des: '
             + data['t_next_des'] +'<p>';
        }
        else{
            contentStr = '<p>Id: <b>'+ result.data['BEBId']+ '</b><br/> Direction:'+ data['direction'] + '<br/> Time to next des: '
             + data['t_next_des'] + '<br/> Remaining battery:<b>' + data['battery'] + '</b> <br/> Cumulative mileage: ' + data['mileage'] +'<p>';
        }

        infoWindow = new google.maps.InfoWindow({
            content: contentStr,
        });
        infoWindow.setPosition(BEBMaker.getPosition());
        infoWindow.open({
            anchor: BEBMaker,
            map,
            shouldFocus: false,
        });
    });
  }
  
/**
 * double click the BEB, color change
 * @param {*} BEBMaker 
 * @param {*} map 
 * @param {*} blockId 
 */
  function BEBMarkerdblClick(BEBMaker, map, blockId){
    infoWindow.close();
    let index = contain(selectedBEBs, blockId);
    let BEBIcon = BEBMaker.getIcon();

    if(index == 'NaN'){
        // double click on the ele, return the basic information and chart information
        axios.post('/eleDBClick', {type: 'BEB', id: blockId}).then(function(result){
            /**
             * {'basicInfo': basic_info, 'batteryMileageInfo': battery_mileage_info}
             */
            data = result.data;
            console.log('data', data);
            basicInfo = data['basicInfo'];
            batteryMileageInfo = data['batteryMileageInfo'];
            renderDetailView(basicInfo, batteryMileageInfo);
        });
        // select 
        selectedBEBs.push(blockId);
        // change color to orange
        BEBIcon['fillColor'] = red;
        BEBMaker.setIcon(BEBIcon);
        BEBMaker.setMap(map);  
    }
    else{
        // deselect
        selectedBEBs.splice(index, 1);
        // change the color to red
        BEBIcon['fillColor'] = '#2B5F5D';
        BEBMaker.setIcon(BEBIcon);
        BEBMaker.setMap(map);  
    }
  }

/**
 * all BEBs appear (when zoom out then zoom in)
 */
function BEBsAppear(){
    for(let key in BEBMakers){
        BEBMakers[key]['maker'].setMap(map);
    }
}

/**
 * all BEBs appear (when zoom out)
 */
function BEBsDisappear(){
    for(let key in BEBMakers){
        BEBMakers[key]['maker'].setMap(null);
    }
}
