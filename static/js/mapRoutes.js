/**
 * This script is used to handle rendering routes, updating routes, and listening events of routes
 */

let clickRouteID = '';      // the id of clicked charging station

/**
 * Render Routes
 * @param {*} map 
 * @param {*} routes 
 */
 function RenderRoutes(map, routes){
    console.log('routes:', routes);
    // remove previous Data first
    map.data.forEach(function(feature) {
      map.data.remove(feature);
    });

    features = map.data.addGeoJson(routes);
    
    map.data.setStyle({
        strokeColor: red,
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
    });
    
    let flag;       // distinguish the click and double click event

    // add listener to data (include each feature)
    map.data.addListener('click', function(event) {
        flag = 0;
        update_timeout = setTimeout(function(){
            if (flag == 0) {
                // restore the clicked route first
                restoreClkRoute();
                clickRouteID = event.feature.getProperty('LineAbbr');
                clk(event);
            };
        }, 300);   
    });

    //double click
    map.data.addListener('dblclick', function(event) {
        flag = 1;
        let curZoom = map.getZoom();
        if(curZoom < 12){
            map.setZoom(12);
            infoWindow.close();
            restoreClkRoute();
            dblClickRoute(event);
        }
        else{
            infoWindow.close();
            restoreClkRoute();
            dblClickRoute(event);
        }
    });

}

/**
 * when time changes, update the route opacity
 */
 function updateRouteOpacity(routesOpacity){
    map.data.forEach(function(feature){
      curRoute = feature.getProperty('LineAbbr');
      map.data.overrideStyle(feature, {strokeOpacity: routesOpacity[curRoute]});
    });
  }

/**
 * click on the route, then highlight this route, and reveal BEBS on this route
 * 
 * if this route has not been selected:
 *   renderNew BEBs
 * if this route has been selected: deselecte:
 *   remove it from the selected BEB
 *   restore the color of this line
 *   remove BEBs on this route
 * @param {*} event 
 */
function dblClickRoute(event){
    // get the line abbr
    let routeNum = event.feature.getProperty('LineAbbr');
    let index = contain(selectedRoutes, routeNum)

    axios.post('/Rclk', {routeNum: routeNum}).then(function(result){
        if(index == 'NaN'){
            // this route has not been selected
            selectedRoutes.push(routeNum);

            // render the BEBs on this route
            renderBEBMaker(result.data);

            // set the style of this route
            map.data.forEach(function(feature){
                let curRoute = feature.getProperty('LineAbbr');
                if(curRoute == routeNum){
                    map.data.overrideStyle(feature, {strokeColor: 'orange'});
                    map.data.overrideStyle(feature, {strokeWeight: 4});
                }
            });
        }
        else{
            // this route has been selected
            selectedRoutes.splice(index, 1);

            // delete the BEBs on this route
            delBEBMaker(result.data);

            // restore the style of this route
            map.data.forEach(function(feature){
                let curRoute = feature.getProperty('LineAbbr');
                if(curRoute == routeNum){
                    map.data.overrideStyle(feature, {strokeColor: red});
                    map.data.overrideStyle(feature, {strokeWeight: 1.5});
                }
            });

        }
        
      
    });   
}

/**
 * check if ele in lst, if so, return the index, else 
 */
function contain(lst, ele){
    for(let i = 0; i < lst.length; i++){
        if(lst[i] == ele){
            return i;
        }
    }
    return 'NaN';
}


/**
 * click on the route, popup appear
 * @param {*} event 
 */
function clk(event){
    // hightlight the clicked route
    map.data.forEach(function(feature){
        let curRoute = feature.getProperty('LineAbbr');
        if(curRoute == clickRouteID){
            map.data.overrideStyle(feature, {strokeColor: 'orange'});
        }
    });

    infoWindow.close();

    let pos = event.latLng;     // the click position
    console.log('pos:', pos);

    // get the clicked route, then return the relavant information
    // {'LineAbbr': , 'Destinations': [des1, des2], 'BEBNum': }
    axios.post('/eleClick', {type: 'route', id: clickRouteID}).then(function(result){
        console.log(result);
        contentStr = '<p>LineAbbr: '+'<b>'+ result.data['LineAbbr'] + '</b>'+ '<br/>Des: '+
         result.data['Destinations'][0] + ', ' + result.data['Destinations'][1] + '<br/>'
          + 'BEB number: ' + result.data['BEBNum'] + '<p>';

        infoWindow = new google.maps.InfoWindow({
            content: contentStr,
          });
        infoWindow.setPosition(pos);
        infoWindow.open({
            map,
            shouldFocus: false,
        });
    });
}

/**
 * restore the color of the clicked route
 * when single click on other things, the route will restore first, except for the route has been selected
 */
function restoreClkRoute(){
    if(clickRouteID){
        index = contain(selectedRoutes, clickRouteID);
        if(index == 'NaN'){
            // the route is not been selected
            map.data.forEach(function(feature){
                let curRoute = feature.getProperty('LineAbbr');
                if(curRoute == clickRouteID){
                    map.data.overrideStyle(feature, {strokeColor: red});
                }
            });
            // restore state
            clickRouteID = '';
        }
    }
}
