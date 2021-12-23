/**
 * This script is used to handle the range change event
 */

let curTime = '';    // the current time

 d3.select('#timeBarInput').on('change', function(event){
    let val = d3.select(this).node().value;
    let ratio = val/100;
    axios.post("/time", {ratio: ratio, selectedRoutes: selectedRoutes})
      .then(function(result){
         console.log(result.data['C_stations'])
         updateRouteOpacity(result.data['opacity'])
         updateChargingStation(result.data['C_stations'])
         if(selectedRoutes.length != 0){
            updateBEBMaker(result.data['BEBs']);
         }
         // update the opacity of routes
         // change the line chart according to time
         UpdateChart('BEBChart', BusData, ratio);
         UpdateChart('BEBRouteChart', RouteData, ratio);
         // UpdateChart('ChargingChart', ChargingStationData, ratio);
      });
 })


/**
 * when drag the time bar
 */
 function drag(){
   console.log('enter drag');
   return d3.drag()
      .on("start", function(){
         console.log('enter start');
      })
      .on("drag", function(){
         console.log('enter drag');
      })
      .on("end", dragEnded);
}


/**
 * render the time bar chart
 * @param {*} BEBs_dtb  [[hour, minute, num of BEB], ...]
 */
function renderTimeBarChart(BEBs_dtb){
   let padding = {'top': 10, 'bottom': 3, 'left': 20, 'right': 10};

   let chartSvg = d3.select('#timeView').append('svg')
      .attr("width", d3.select('#timeView').style('width'))
      .attr("height", d3.select('#timeView').style('height'))
      .attr("style", "position: absolute; left: 0px; right: 0; top: 0; bottom: 0; padding: 0;margin: auto;");

   let width = parseInt(chartSvg.style('width')) - padding.left - padding.right;
   let height = parseInt(chartSvg.style('height')) - padding.top - padding.bottom;
   console.log('width', width);
   console.log('height', height);

   // x and y scale
   let yScale = d3.scaleLinear().domain([0, d3.max(BEBs_dtb, (d)=>d[2])]).range([height, 0]);
   let xScale = d3.scaleTime()
      .domain([new Date(2000, 1, 1, 4, 30, 0), new Date(2000, 1, 1, 23, 30, 0)])
      .range([0, width]);

   // render the x and y axises
   let xAxis = chartSvg.append('g').attr('id', 'xAxis')
        .attr('transform', 'translate('+''+ padding.left + ',' + (height+padding.top) +')')
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(4)));
   let yAxis = chartSvg.append('g').attr('id', 'yAxis')
        .attr('transform', 'translate('+''+ (padding.left + width) + ',' + padding.top +')')
        .call(d3.axisRight(yScale).ticks(4));
   
   // delete all yAxis ticks and line
   d3.select('#yAxis').selectAll('path').remove();
   d3.select('#yAxis').selectAll('line').remove();
   d3.select('#xAxis').selectAll('path').remove();
   d3.select('#xAxis').selectAll('line').remove();
   
   // modify the style of text
   d3.select('#yAxis').selectAll('text')
      .style('font-size', '6px')
      .style('text-anchor', 'end')
      .style('dx', '10px')
      .style('fill', 'rgba(102, 102, 102, 1)');

   d3.select('#xAxis').selectAll('text')
      .style('font-size', '6px')
      .style('text-anchor', 'middle')
      .attr('dy', '-1em')
      .style('fill', 'rgba(102, 102, 102, 1)');

   console.log('time', xScale(new Date(2000, 1, 1, BEBs_dtb[0][0], BEBs_dtb[0][1], 0)));
   console.log('timeY', yScale(BEBs_dtb[0][2]));   

   // render the title and a line
   let gapLine = chartSvg.append('line')
      .attr('stroke', 'rgba(102, 102, 102, 0.3)')
      .attr('stroke-width', 1)
      .attr('x1', padding.left)
      .attr('y1', parseInt(chartSvg.style('height')))
      .attr('x2', padding.left)
      .attr('y2', 0);
   let y_ = parseInt(chartSvg.style('height'))/2;
   let titleText = chartSvg.append('text')
      .attr('x', 13)
      .attr('y', y_)
      .attr('fill', 'rgba(102, 102, 102, 1)')
      .attr('font-size', '8px')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Helvetica')
      .attr('transform', `rotate(270 13, ${y_})`)
      .text('BEBs on Routes');


   // render the chart line
   let line = d3.line()
      .x((d)=>{
         return xScale(new Date(2000, 1, 1, d[0], d[1], 0))+padding.left;
      })
      .y((d)=>{
         return yScale(d[2])+padding.top;
      })
      .curve(d3.curveStep);
      
   let chart_line = chartSvg.append('path')
      .attr('stroke', red)
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')
      .attr('d', line(BEBs_dtb));
   
   // draw a line as a time bar
   let bar = chartSvg.append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3,1')
      .attr('x1', padding.left+3)
      .attr('y1', parseInt(chartSvg.style('height')))
      .attr('x2', padding.left +3)
      .attr('y2', 0)
      .style("cursor", "pointer")
      .call(d3.drag().on("start", dragStarted)
                     .on('drag', dragged)
                     .on('end', dragEnded));
   // the translation of the time bar
   let curTranslation = 5;
   let minTranslation = padding.left+3, maxTranslation = width+minTranslation;

   // draw a rect as the selected area
   let slectedArea = chartSvg.append('rect')
      .attr('x', padding.left)
      .attr('y', 0)
      .attr('width', 3)
      .attr('height', parseInt(chartSvg.style('height')))
      .attr('stroke', 'none')
      .style('fill', 'rgba(102, 102, 102, 0.05)');
   
   // when the drag end there will appear time and num of BEBs
   let numText = chartSvg.append('text')
      .attr('y', 10)
      .attr('fill', 'black')
      .style('fill-opacity', 0.7)
      .attr('font-size', '10px')
      .attr('text-anchor', 'start')
      .attr('font-family', 'Helvetica');
   let timeText = chartSvg.append('text')
      .attr('y', parseInt(chartSvg.style('height'))-10)
      .attr('fill', 'black')
      .style('fill-opacity', 0.7)
      .attr('font-size', '10px')
      .attr('text-anchor', 'start')
      .attr('font-family', 'Helvetica');

   // handle three kinds of events
   function dragStarted(event){
      let curX = event.x;
      if(curX>=minTranslation && curX<=maxTranslation){
         d3.select(this).attr('x1', curX).attr('x2', curX);
         slectedArea.attr('width', curX-padding.left);
         numText.text('');
         timeText.text('');
      }      
   }
   function dragged(event){
      d3.select(this).attr('stroke-width', 3).attr('stroke-opacity', 0.6);
      let curX = event.x;
      if(curX>=minTranslation && curX<=maxTranslation){
         d3.select(this).attr('x1', curX).attr('x2', curX);
         slectedArea.attr('width', curX-padding.left);
      }      
   }
   function dragEnded(event){
      d3.select(this).attr('stroke-width', 2.5).attr('stroke-opacity', 0.5);
      let curX = event.x;
      if(curX>=minTranslation && curX<=maxTranslation){
          // then find the current time
         let time = xScale.invert(curX-padding.left);
         console.log('time', time);
         // find the value at this time
         let hour = time.getHours(), minute = time.getMinutes();
         curTime = new Date(2000, 1, 1, hour, minute);
         
         d3.select(this).attr('x1', curX).attr('x2', curX);
         slectedArea.attr('width', curX-padding.left);

         let numOnRoutes = 0;
         for(let i = 0; i < BEBs_dtb.length; i++){
            if(BEBs_dtb[i][0]>=hour){
               if(BEBs_dtb[i][1]=minute){
                  numOnRoutes = BEBs_dtb[i][2];
                  break
               }
               else if (BEBs_dtb[i][1]>minute){
                  if(i>0){
                     numOnRoutes = BEBs_dtb[i-1][1][2];
                  }
               }
            }
         }

         // appear time and num
         numText.attr('x', curX+2).text(numOnRoutes);
         timeText.attr('x', curX+2).text(hour+':'+minute);

         // post the time to the backend
         axios.post("/time", {time: [hour, minute], selectedRoutes: selectedRoutes})
            .then(function(result){
               console.log(result.data['C_stations']);
               updateRouteOpacity(result.data['opacity']);
               updateChargingStation(result.data['C_stations']);
               updateBEBTable(result.data['BEB_table_info']);
               if(selectedRoutes.length != 0){
                  updateBEBMaker(result.data['BEBs']);
               }
               // update the opacity of routes
               // change the line chart according to time
               // UpdateChart('BEBChart', BusData, ratio);
               // UpdateChart('BEBRouteChart', RouteData, ratio);
               // UpdateChart('ChargingChart', ChargingStationData, ratio);
            });

         }
      
     
      
   }

}












