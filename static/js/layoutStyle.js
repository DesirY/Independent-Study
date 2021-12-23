/**
 * This script is used to adjust the style of interface
 */
// color
red = '#CB0300';
grayBorder = 'rgba(102, 102, 102, 0.6)';

// title style
function setTitleStyle(){
    // change the title style in the title bar
    d3.select('#titleSvg')
        .append('text')
        .attr('x', ()=>{
            return parseInt(d3.select('#titleBarDiv').style('width'))/2;
          })
        .attr('y', ()=>{
            return parseInt(d3.select('#titleBarDiv').style('height'))/2;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', 15)
        .attr("font-family", "helvetica")
        .attr('dy', '0.6em')
        .attr('fill', 'white')
        .attr('fill-opacity', 1)
        .attr('stroke', 'white')
        .attr('stroke-width', 0)
        .text('Battery  Electric  Bus  Deployment');
}

// map div
function setMapDivStyle(){
    // change the border
    d3.select('#mapDiv')
        .style('border-width', '1px')
        .style('border-color', grayBorder)
        .style('border-opacity', '1');
    // change the border of
    d3.select('#illustrateDiv')
        .style('border-width', '1px')
        .style('border-color', grayBorder)
        .style('opacity', '1');
    // change the style of BEB
    d3.select('#BEBDiv')
        .style('border-width', '1px')
        .style('border-color', grayBorder)
        .style('opacity', '1');
    // change the style of BEBRouteDiv
    d3.select('#BEBRouteDiv')
        .style('border-width', '1px')
        .style('border-color', grayBorder)
        .style('opacity', '1');
    // change the style of ChargingDiv
    d3.select('#ChargingDiv')
        .style('border-width', '1px')
        .style('border-color', grayBorder)
        .style('opacity', '1');
}

/**
 * set the information title
 * @param {*} top 
 * @param {*} text 
 * @param {*} width 
 */
function setInfoTitle(top, text, width){
    let infoTitleDiv = d3.select('#interfaceDiv')
        .append('div')
        .attr('class', 'infoTitle')
        .style('top', top+'px')
        .style('width', width+'px');
    
    // add svg and text
    let infoTitleText = infoTitleDiv.append('svg')
        .attr('class', 'infoTitleSvg')
        .style('width', width+'px')
        .style('background-color', red)
        .append('text')
        .attr('x', ()=>{
            return parseInt(infoTitleDiv.style('width'))/2;
        })
        .attr('y', ()=>{
            return parseInt(infoTitleDiv.style('height'))/2;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', 10.5)
        .attr("font-family", "helvetica")
        .attr('dy', '0.35em')
        .attr('fill', 'white')
        .attr('fill-opacity', 1)
        .attr('stroke', 'white')
        .attr('stroke-width', 0)
        .text(text);
}

function setLayoutStyle(){
    // change the title style
    setTitleStyle();
    // change the map div style
    setMapDivStyle();
    // set three information title
    // setInfoTitle(108, 'BEB', 27);       //BEB
    // setInfoTitle(418, 'BEB Route', 58);     //BEB Route
    // setInfoTitle(728, 'Charging Station', 82);     //Charging station
}
setLayoutStyle();