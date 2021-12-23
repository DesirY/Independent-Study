/**
 * This script is used to draw charts/ position charts and response
 */

// padding for the three charts.
const padding = {left: 25, right: 10, top: 20, bottom: 20};
const BusData = [[0, 0], [0.1, 5], [0.2, 9], [0.35, 16], [0.5, 20],
                [0.65, 26], [0.85, 30], [0.9, 35], [0.95, 38], [0.98, 42]];
const RouteData = [[0, 1], [0.2, 1], [0.2, 2], [0.35, 2], [0.35, 3],
                [0.65, 3], [0.65, 2], [0.8, 2], [0.8, 4], [0.98, 4], [0.98, 5]];
const ChargingStationData = [[0, 0], [0.1, 0], [0.1, 200], [0.12, 200], [0.12, 0], [0.35, 0], [0.35, 300], [0.4, 300],
                [0.4, 0], [0.65, 0], [0.65, 100], [0.7, 100], [0.8, 100], [0.8, 0], [0.9, 0], [0.9, 200], [0.98, 200], [0.99, 0]];
/**
 * render charts
 * @param {} divId 
 */
function drawChart(divId, data, titleText){
    let chartSvg = d3.select('#'+divId).append('svg')
        .attr('class', 'chartSvg');
    
    let width = parseInt(chartSvg.style('width')) - padding.left - padding.right;
    let height = parseInt(chartSvg.style('height')) - padding.top - padding.bottom;

    // define the scale
    let xScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){
            return d[0];
        })])
        .range([0, width]);
    
    let xTextScale = d3.scaleOrdinal()
        .domain(['6:00', '9:00', '12:00', '15:00', '18:00'])
        .range([0, width/5, width/5*2, width/5*3, width/5*4, width]);
    
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){
            return d[1];
        })])
        .range([height, 0]);
    
    // let circle = chartSvg.selectAll('circle')
    //     .data(center)
    //     .enter()
    //     .append('circle')
    //     .attr('fill', 'red')
    //     .attr('cx', function(d){
    //         return padding.left + xScale(d[0]);
    //     })
    //     .attr('cy', function(d){
    //         return  padding.top + yScale(d[1]);
    //     })
    //     .attr('r', 5);

    // draw the x axis and y axis
    let xAxis = chartSvg.append('g')
        .attr('transform', 'translate('+''+ padding.left + ',' + (height+padding.top) +')')
        .call(d3.axisBottom(xTextScale).ticks(5));
    let yAxis = chartSvg.append('g')
        .attr('transform', 'translate('+''+ (padding.left) + ',' + (padding.top) +')')
        .call(d3.axisLeft(yScale).ticks(4));

    // generate line
    let line = d3.line()
        .x((d)=>(padding.left + xScale(d[0])))
        .y((d)=>(padding.top + yScale(d[1])));
    
    // draw the title of x/y axis
    let lines2 = chartSvg
        .append('path')
        .attr('class', 'HidenChartLine')
        .attr('stroke', 'red')
        .attr('stroke-width', '2px')
        .attr('stroke-opacity', '0.3')
        .attr('fill', 'none')
        .attr('d', line(data));

    // draw the title of x/y axis
    let lines = chartSvg
        .append('path')
        .attr('class', 'chartLine')
        .attr('stroke', 'red')
        .attr('stroke-width', '2px')
        .attr('stroke-opacity', '0')
        .attr('fill', 'none')
        .attr('d', line(data));

    // add a title for this graph
    let title = chartSvg
        .append('text')
        .attr("x", (width / 2 + padding.left))             
        .attr("y",10)
        .style("font-family", 'Helvetica')
        .attr("text-anchor", "middle")  
        .style("font-size", "10px") 
        .text(titleText);
}

/**
 * update the line as the time bar changes
 * @param {} divId 
 * @param {*} data 
 */
function UpdateChart(divId, data, ratio){
    let chartLine = d3.select('#'+divId).select('.chartLine');

    maxX = d3.max(data, (d)=>d[0]);
    minX = d3.min(data, (d)=>d[0]);
    widthX = maxX - minX;

    let chartSvg = d3.select('#'+divId).append('svg')
    .attr('class', 'chartSvg');

    let width = parseInt(chartSvg.style('width')) - padding.left - padding.right;
    let height = parseInt(chartSvg.style('height')) - padding.top - padding.bottom;

    // define the scale
    let xScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){
            return d[0];
        })])
        .range([0, width]);
    
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){
            return d[1];
        })])
        .range([height, 0]);

    // define the new line
    dataX = [0];
    dataY= [0];
    for(let i = 0; i < data.length; i++){
        dataX.push(data[i][0]);
        dataY.push(data[i][1]);
    }
    curX = minX + widthX*ratio;
    // the x y relationship
    dataScalar = d3.scaleLinear()
        .domain(dataX)
        .range(dataY);
    newLineData = [];

    for(let i = 0; i < data.length; i++){
        if(data[i][0] > curX){
            newLineData.push([curX, dataScalar(curX)]);
            break;
        }
        else{
            newLineData.push(data[i]);
        }
    }

    // generate line
    let line = d3.line()
        .x((d)=>(padding.left + xScale(d[0])))
        .y((d)=>(padding.top + yScale(d[1])));

    // draw the title of x/y axis
    chartLine
        .attr('class', 'chartLine')
        .attr('stroke', '#CB0300')
        .attr('stroke-opacity', '1')
        .attr('fill', 'none')
        .attr('d', line(newLineData));

}

drawChart('BEBChart', BusData, 'Accumulated Mileage');
drawChart('BEBRouteChart', RouteData, 'Bus on Route');
// drawChart('ChargingChart', ChargingStationData, 'Charging Need');
