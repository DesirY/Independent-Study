/**
 * This script is used to render the detail view
 */

/**
 * 
 * @param {*} basicInfo {'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': }
 * @param {*} batteryMileageInfo [[hours, minutes, battery_status, mileage_status], ...]
 */
function renderDetailView(basicInfo, batteryMileageInfo){
    // clear the last svg
    d3.select('#chartPart').select('svg').remove();

    // create the detail svg
    let width = d3.select('#chartPart').style('width');
    let height = d3.select('#chartPart').style('height');

    let detailSvg = d3.select('#chartPart').append('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("style", "position: absolute; left: 0px; right: 0; top: 0; bottom: 0; padding: 0;margin: auto;");

    let seq_miss = basicInfo['seq_miss'];
    
    //render the chart part
    renderInfoPart(basicInfo);
    if(!seq_miss){
        renderChartPart(batteryMileageInfo, detailSvg);
    }
}

/**
 * render the information part
 * @param {*} basicInfo [[hours, minutes, battery_status, mileage_status], ...]
 */
function renderInfoPart(basicInfo){
    let seq_miss = basicInfo['seq_miss'];

    // render text 
    let BEBId = basicInfo['BEBId'], t_next_des = basicInfo['t_next_des'], direction = basicInfo['direction'];
    d3.select('#left1').text('BEB');
    d3.select('#left2').text('Direction');
    d3.select('#left3').text('Time to next stop');

    d3.select('#right1').text(BEBId);
    d3.select('#right2').text(direction);
    d3.select('#right3').text(t_next_des);

    if(!seq_miss){
        let battery = basicInfo['battery'], mileage = basicInfo['mileage'];
        d3.select('#left4').text('Battery');
        d3.select('#left5').text('Mileage');
        d3.select('#right4').text(battery);
        d3.select('#right5').text(mileage);
    }

}

/**
 * 
 * @param {*} batteryMileageInfo [[hours, minutes, battery_status, mileage_status], ...]
 * @param {*} detailSvg 
 */
function renderChartPart(batteryMileageInfo, detailSvg){
    let padding = {'top': 30, 'bottom': 3, 'left': 10, 'right': 10};
    
    let width = parseInt(detailSvg.style('width')) - padding.left - padding.right;
    let height = parseInt(detailSvg.style('height')) - padding.top - padding.bottom;
    
    // x and y scale
    let yMileageScale = d3.scaleLinear().domain([0, d3.max(batteryMileageInfo, (d)=>d[3])]).range([height, 0]);
    let yBatteryScale = d3.scaleLinear().domain([0, d3.max(batteryMileageInfo, (d)=>d[2])]).range([height, 0]);
    let xScale = d3.scaleTime()
        .domain([new Date(2000, 1, 1, 4, 30, 0), new Date(2000, 1, 1, 23, 30, 0)])
        .range([0, width]);
    
    // render the x and y axises
    let xAxis = detailSvg.append('g').attr('id', 'xAxis')
            .attr('transform', 'translate('+''+ padding.left + ',' + (height+padding.top) +')')
            .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(2)));
    let yMileageAxis = detailSvg.append('g').attr('id', 'yMileageAxis')
            .attr('transform', 'translate('+ padding.left + ',' + padding.top +')')
            .call(d3.axisLeft(yMileageScale).ticks(5));
    let yBatteryAxis= detailSvg.append('g').attr('id', 'yBatteryAxis')
            .attr('transform', 'translate('+''+ (padding.left + width) + ',' + padding.top +')')
            .call(d3.axisRight(yBatteryScale).ticks(4));
    
    // delete all yAxis ticks and line
    detailSvg.select('#yMileageAxis').selectAll('path').remove();
    detailSvg.select('#yMileageAxis').selectAll('line').remove();
    detailSvg.select('#yBatteryAxis').selectAll('path').remove();
    detailSvg.select('#yBatteryAxis').selectAll('line').remove();
    detailSvg.select('#xAxis').selectAll('path').remove();
    detailSvg.select('#xAxis').selectAll('line').remove();
    
    // modify the style of text
    detailSvg.select('#yMileageAxis').selectAll('text')
        .style('font-size', '6px')
        .style('text-anchor', 'start')
        .attr('dx', '2px')
        .style('fill', 'rgba(102, 102, 102, 1)')
        .style('fill', red)
        .style('fill-opacity', 0.8);
    
    detailSvg.select('#yBatteryAxis').selectAll('text')
        .style('font-size', '6px')
        .style('text-anchor', 'end')
        .style('dx', '10px')
        .style('fill', 'rgba(102, 102, 102, 1)')
        .style('fill', blue)
        .style('fill-opacity', 0.8);
    
    detailSvg.select('#xAxis').selectAll('text')
        .style('font-size', '6px')
        .style('text-anchor', 'middle')
        .attr('dy', '-1em')
        .style('fill', 'rgba(102, 102, 102, 1)');
    
    // render the chart line
    let mileageLine = d3.line()
        .x((d)=>{
            return xScale(new Date(2000, 1, 1, d[0], d[1], 0))+padding.left;
        })
        .y((d)=>{
            return yMileageScale(d[3])+padding.top;
        });
        
    let chartMileageLine = detailSvg.append('path')
        .attr('stroke', red)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6)
        .attr('fill', 'none')
        .attr('d', mileageLine(batteryMileageInfo));
    
    let batteryLine = d3.line()
        .x((d)=>{
            return xScale(new Date(2000, 1, 1, d[0], d[1], 0))+padding.left;
        })
        .y((d)=>{
            return yBatteryScale(d[2])+padding.top;
        });
        
    let chartBatteryLine = detailSvg.append('path')
        .attr('stroke', blue)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6)
        .attr('fill', 'none')
        .attr('d', batteryLine(batteryMileageInfo));
    
    // add the title
    let chartTitle = detailSvg.append('text')
        .attr('x', parseInt(detailSvg.style('width'))/2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-family', 'Helvetica')
        .style('fill', 'rgba(102, 102, 102, 1)')
        .text('Mileage/Battery Status');
    
    // add the notes of y axies
    let mileageNote = detailSvg.append('text')
        .attr('x', 2)
        .attr('y', 20)
        .attr('text-anchor', 'start')
        .style('font-size', '8px')
        .style('font-family', 'Helvetica')
        .style('fill', red)
        .style('fill-opacity', 0.6)
        .text('Mileage');

    let batteryNote = detailSvg.append('text')
        .attr('x', parseInt(detailSvg.style('width'))-2)
        .attr('y', 20)
        .attr('text-anchor', 'end')
        .style('font-size', '8px')
        .style('font-family', 'Helvetica')
        .style('fill', blue)
        .style('fill-opacity', 0.6)
        .text('Battery');

    // draw a line
    let timeLine = detailSvg.append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.40)
      .attr('stroke-dasharray', '3,1')
      .attr('x1', xScale(curTime)+padding.left)
      .attr('y1', padding.top+height+padding.bottom)
      .attr('x2', xScale(curTime)+padding.left)
      .attr('y2', padding.top-10);


}