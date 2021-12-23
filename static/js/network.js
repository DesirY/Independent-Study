/**
 * render the network view
 */

function renderNetwork(nodes){
    console.log(nodes);
    // create the network svg
    let width = d3.select('#networkView').style('width');
    let height = d3.select('#networkView').style('height');

    let networkSvg = d3.select('#networkView').append('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("style", "position: absolute; left: 0px; right: 0; top: 0; bottom: 0; padding: 0;margin: auto;");
    
    // construct the networkData
    let constructNodes = constructNetData(nodes, parseInt(width), parseInt(height));
    let BEBNodes = constructNodes['BEBs'], routeNodes = constructNodes['routes'], chargerNodes = constructNodes['chargers'];

    let linksG = networkSvg.append('g').attr('id', 'linksG');
    // render Links
    for(let i = 0; i < BEBNodes.length; i++){
        // render the BEB-charge link
        let BCLink = d3.linkHorizontal()
                .source(function(d) {
                    return [d.x, d.y];
                })
                .target(function(d) {
                    return [BEBNodes[i].x, BEBNodes[i].y];
                });
        
        linksG.selectAll('links')
            .data(BEBNodes[i]['served_chargers'])
            .enter()
            .append('path')
            .attr('stroke', 'grey')
            .attr('stroke-width', '0.2')
            .attr('fill', 'none')
            .attr('d', BCLink);
        
        let BRLink = d3.linkHorizontal()
            .target(function(d) {
                return [d.x, d.y];
            })
            .source(function(d) {
                return [BEBNodes[i].x, BEBNodes[i].y];
            });
        
        // render the BEB-Routes link
        linksG.selectAll('links')
            .data(BEBNodes[i]['served_routes'])
            .enter()
            .append('path')
            .attr('stroke', 'grey')
            .attr('stroke-width', '0.2')
            .attr('fill', 'none')
            .attr('d', BCLink);
    }

    // render nodes
    networkSvg.append('g').attr('id', 'BEBNodesG')
        .selectAll('BEBNodes')
        .data(BEBNodes)
        .enter()
        .append('circle')
        .attr('cx', d=>d['x'])
        .attr('cy', d=>d['y'])
        .attr('r', 3)
        .attr('stroke', 'none')
        .attr('fill', 'grey')
        .attr('fill-opacity', '0.7');
    networkSvg.append('g').attr('id', 'routeNodesG')
        .selectAll('routeNodes')
        .data(routeNodes)
        .enter()
        .append('circle')
        .attr('cx', d=>d['x'])
        .attr('cy', d=>d['y'])
        .attr('r', 3)
        .attr('stroke', 'none')
        .attr('fill', 'grey')
        .attr('fill-opacity', '0.7');
    networkSvg.append('g').attr('id', 'chargerNodesG')
        .selectAll('chargerNodes')
        .data(chargerNodes)
        .enter()
        .append('circle')
        .attr('cx', d=>d['x'])
        .attr('cy', d=>d['y'])
        .attr('r', 3)
        .attr('stroke', 'none')
        .attr('fill', 'grey')
        .attr('fill-opacity', '0.7');
}

/**
 * update the x, y coordinates and update the BEBs
 * {'BEBs': [{'id': , served_routes: [], served_chargers: []}], 'routes': [{'id': }], 'chargers': [{'id': }]}
 */
function constructNetData(nodes, width, height){
    let padding =  {left: 30, right: 30, top: 20, bottom: 20}

    // update x y coordinates
    let BEBs = nodes['BEBs'], routes = nodes['routes'], chargers = nodes['chargers'];

    let charger_x = padding.left, route_x = width - padding.right, BEB_x = (charger_x+route_x)/2;

    let BEBs_gap = (height-padding.top-padding.bottom)/(BEBs.length - 1),
    routes_gap = (height-padding.top*5-padding.bottom*5)/(routes.length - 1),
    chargers_gap = (height-padding.top*10-padding.bottom*10)/(chargers.length - 1);

    for(let i = 0; i < BEBs.length; i++){
        BEBs[i]['x'] = BEB_x;
        BEBs[i]['y'] = padding.top + BEBs_gap*i; 
    }
    for(let i = 0; i < routes.length; i++){
        routes[i]['x'] = route_x;
        routes[i]['y'] = padding.top*5 + routes_gap*i; 
    }
    for(let i = 0; i < chargers.length; i++){
        chargers[i]['x'] = charger_x;
        chargers[i]['y'] = padding.top*10+chargers_gap*i;
    }

    // update BEBs with real routes and chargers
    for(let i = 0; i < BEBs.length; i++){
        let BEB = BEBs[i];
        
        // update the routes 
        for(let j = 0; j < BEB['served_routes'].length; j++){
            let route_id = BEB['served_routes'][j];
            let route = findRC(route_id, routes);
            BEB['served_routes'][j] = route;
        }
        
        // update the chargers 
        for(let j = 0; j < BEB['served_chargers'].length; j++){
            let charger_id = BEB['served_chargers'][j];
            let charger = findRC(charger_id, chargers);
            BEB['served_chargers'][j] =charger;
        }
    }

    return nodes;

    /**
     * find the data according to the id
     * @param {*} id 
     * @param {*} datatset 
     */
    function findRC(id, lst){
        for(let i = 0; i < lst.length; i++){
            if(lst[i]['id'] == id){
                return lst[i]
            }
        }
    }

}
