// map setting
const mapWid = 750, mapHei = 750;
let mapSvg = d3.select('#mapSvg')
        .attr('width', mapWid+'px')
        .attr('height', mapHei+'px');
let mapG = mapSvg.append('g');  //map group

// map
let map;
let slt = {lat: 40.758701, lng: -111.876183};   // the center of salt lake city
let initZoom = 10;   // set the initial zoom
const mapStylesArray = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text",
      "stylers": [
        {
          "saturation": -85
        },
        {
          "lightness": 45
        },
        {
          "weight": 0.5
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "saturation": -85
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "lightness": 80
        },
        {
          "weight": 0.5
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.province",
      "elementType": "labels.text",
      "stylers": [
        {
          "weight": 0.5
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.business",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ffffff"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dadada"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "road.local",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#c9c9c9"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    }
  ];

// map style
const red = '#EC0001'; 
const blue = '#1E9DA6';
const stop_color = '#80C1C6';
const charging_color= '';
const yellow = '#E77102'

// map elements
let stopMakers = [];
let BEBMakers = {};     // {'blockId': {'maker': }, ....} 
let chargingStationMakers = [];  // [{'name': 'maker': }, {}, ...]
let infoWindow;    // display information
const chargingStationMakerScale = 0.027;
const stopMakerRadius = 150;

// interactions
let selectedRoutes = [];  // the id of the selected routes
let selectedBEBs = [];    // the id of the selected BEBs
let selectedCStations = [];   // the id of the selected charging stations

// map data
let lowIncome = {}  // "30001": 0.3 (area code: number of low income)
let lowIncome0 = 0.0001, lowIncome1 = 80, lowIncome2 = 180, lowIncome3 = 240;
let lowIncome0Color = '#6AAED6', lowIncome1Color = '#2270B5', lowIncome2Color = '#06519C', lowIncome3Color = '#08306B';

// add a center control to this map
function addCenterControl(_map){
    console.log('enter addCenterControl');
    // define a div holding this center control widget
    let controlDiv = d3.select('body').append('div')
        .attr('class', 'fas fa-redo fa-2x')
        .style('color', '#A3A3A3')
        .style('width', '22px')
        .style('padding', '9px')
        .style('height', '22px')
        .style('background', 'white')
        .style('margin', '10px')
        .attr('id', 'centerControlDiv')
        .style('border-radius', '2px')
        .style('box-shadow', 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px')
        .style('cursor', 'pointer');
    
    // add click listener to this div
    controlDiv.on('click', (event)=>{
        _map.setCenter(slt);
        _map.setZoom(initZoom);
    })

    // add this CenterControl to map
    _map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv.node());
}

// update BEBTable information
function UpdateBEBTable(bus){
    // remove first
    d3.select("#BEBtableDiv").selectAll('.itemContent').remove();
    //update all data in bus
    d3.select("#BEBtableDiv").select('tbody').selectAll('busItem').data(bus)
        .enter()
        .append('tr')
        .attr('class', 'itemContent')
        .each(function(d, i){
            //console.log(d);
            d3.select(this)
                .append('td')
                .text(d['block_num']);
            d3.select(this)
                .append('td')
                .text(d['lineAbbr']);
            d3.select(this)
                .append('td')
                .text(parseInt(d['pollutant']));
        });
}

// update BEBRouteTable information 
function UpdateBEBRouteTable(routes){
    // remove first
    d3.select("#BEBRoutetableDiv").selectAll('.itemContent').remove();
    //update all data in bus
    d3.select("#BEBRoutetableDiv").select('tbody').selectAll('BEBRouteItem').data(routes['features'])
        .enter()
        .append('tr')
        .attr('class', 'itemContent')
        .each(function(d, i){
            //console.log(d);
            d3.select(this)
                .append('td')
                .text(d['properties']['LineAbbr']);
            d3.select(this)
                .append('td')
                .text(d['properties']['LineName']);
            d3.select(this)
                .append('td')
                .text(d['properties']['Service']);
            d3.select(this)
                .append('td')
                .text(d['properties']['Frequency']);
        });
}

/**
 * Render stops
 */
function RenderStops(map, stops){
    // first clear previous stops
    for(let i = 0; i < stopMakers.length; i++){
        stopMakers[i].setMap(null);
    }
    stopMakers = [];

    for(let i = 0; i < stops.length; i++){
        let stop = stops[i]['coordinates'];
        // render stop as a circle 
        let stopCircle = new google.maps.Circle({
            strokeColor: 'grey',
            strokeOpacity: 0.8,
            strokeWeight: 0.1,
            fillColor: stop_color,
            fillOpacity: 1,
            center: {lat: stop['lat'], lng: stop['lng']},
            radius: stopMakerRadius,
            zIndex: 3,
        });
        stopMakers.push(stopCircle);
    }
}

/**
 * Render routes, stops, charging station, and upodate the bus table and route bus
 */
function renderMapEles(map, result){
    // console.log('enter renderMapEles');
    bus = result['BEBs'];
    routes = result['Routes'];
    stops = result['Stops'];
    charging_stations = result['Chargings'];

    console.log('routes', routes);
    console.log('bus', bus);
    console.log('stops', stops);
    console.log('charging_stations', charging_stations);

    UpdateBEBTable(bus);
    UpdateBEBRouteTable(routes);
    RenderStops(map, stops);
    RenderRoutes(map, routes);
    RenderChargingStation(map, charging_stations);
}

// init map automatically
function initMap() {
    // load low income json data 
    // d3.json('../data/lowIncome.json').then((result)=>{
    //   lowIncome = result;
    // });

    let options = {
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            scaleControl: true,
            mapTypeControl: false,
            center: slt,
            zoom: initZoom,
            minZoom: initZoom - 6,
            maxZoom: initZoom + 3,
            styles: mapStylesArray,
            disableDoubleClickZoom: true
          };
    map = new google.maps.Map(d3.select("#mapDiv").node(), options);
    infoWindow = new google.maps.InfoWindow();

    // add a center control to this map
    addCenterControl(map);
    // renderMapEles(map, 1);
    // zoom change handler
    map.addListener("zoom_changed", () => {
      zoomChangeHandler(map);
    });
}