/**
 * This script is used to render and update the BEB table
 */
 
const maxMileage = 200;

/**
 * init all data
 * @param {*} BEBInfo {BEB_id: {periods: , served_charges: , served_routes: }}
 */
function renderBEBTable(BEBInfo){
    console.log('enter renderBEBTable');
    console.log(BEBInfo);
    let BEBNum = Object.keys(BEBInfo).length;
    d3.select('#BEBTableDiv').style('grid-template-rows', `repeat(${BEBNum+1}, 20px)`);

    // init all the items
    for(BEBId in BEBInfo){
        let servedRoutes = BEBInfo[BEBId]['served_routes'].join();
        let status = 'On the stop';
        let energy = 1;
        let mileage = 0;
        let sequenceMiss = BEBInfo[BEBId]['periods'][0]['seq_miss'];
        
        // init five divs for it
        let IDDiv= d3.select('#BEBTableDiv').append('div')
            .attr('class', 'BEBTableItem')
            .attr('id', `_${BEBId}ID`)
            .style('color', 'rgba(102, 102, 102, 1)')
            .text(BEBId);
        
        let StatusDiv = d3.select('#BEBTableDiv').append('div')
            .attr('class', 'BEBTableItem')
            .attr('id', `_${BEBId}Status`)
            .style('color', 'rgba(102, 102, 102, 1)')
            .text(()=>{
                if(sequenceMiss != true){
                    return 'On the stop';
                }
                else{
                    return '';
                }
            });

        // energy and bar
        let EnergyDiv = d3.select('#BEBTableDiv').append('div')
            .attr('class', 'BEBTableItem')
            .attr('id', `_${BEBId}Energy`);
        EnergyDiv.append('svg')
            .attr('width', EnergyDiv.style('width'))
            .attr('height', EnergyDiv.style('height'))
            .append('rect')
            .attr('x', 0)
            .attr('y', 8)
            .attr('width', EnergyDiv.style('width'))
            .attr('height', 3.9)
            .style('fill-opacity', 0.6)
            .attr('fill',  ()=>{
                if(sequenceMiss == true){
                    return 'rgba(102, 102, 102, 1)';
                }
                else{
                    return red;
                }
            });

        let MileageDiv = d3.select('#BEBTableDiv').append('div')
            .attr('class', 'BEBTableItem')
            .attr('id', `_${BEBId}Mileage`);
       
        MileageDiv.append('svg')
            .attr('width', MileageDiv.style('width'))
            .attr('height', MileageDiv.style('height'))
            .append('rect')
            .attr('x', 0)
            .attr('y', 8)
            .attr('width', () =>{
                if(sequenceMiss == true){
                    return MileageDiv.style('width');
                }
                else{
                    return 0;
                }
            })
            .attr('height', 3.9)
            .style('fill-opacity', 0.6)
            .attr('fill',  ()=>{
                if(sequenceMiss == true){
                    return 'rgba(102, 102, 102, 1)';
                }
                else{
                    return blue;
                }
            });
        
        let ServedRoutesDiv = d3.select('#BEBTableDiv').append('div')
            .attr('class', 'BEBTableItem')
            .attr('id', `_${BEBId}ServedRoutes`)
            .style('color', 'rgba(102, 102, 102, 1)')
            .text(servedRoutes);
    }
}

/**
 * update the table when time changes
 * @param {*} updateInfo  [{'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': },...]
 */
function updateBEBTable(updateInfo){
    console.log('update info', updateInfo);
    for(let i = 0; i < updateInfo.length; i++){
        console.log(updateInfo[i]);
        let BEBId = updateInfo[i]['BEBId'];
        let battery = updateInfo[i]['battery'];
        let mileage = updateInfo[i]['mileage'];
        let status = updateInfo[i]['status'];
        let seqMiss = updateInfo[i]['seq_miss'];

        if(seqMiss == false){
            // update status
            d3.select('#BEBTableDiv').select(`#_${BEBId}Status`)
                .style('color', ()=>{
                    if(status=='On the route'){
                        return 'orange';
                    }
                    else{
                        return 'rgba(102, 102, 102, 1)';
                    }
                })
                .text(status);
            
            // update the battery
            d3.select(`#_${BEBId}Energy`)
                .select('rect')
                .attr('width', ()=>{
                    let full_width = parseInt(d3.select(`#_${BEBId}Energy`).style('width'));
                    return full_width*battery;
                });
            
            // update the mileage
            d3.select(`#_${BEBId}Mileage`)
                .select('rect')
                .attr('width', ()=>{
                    let full_width = parseInt(d3.select(`#_${BEBId}Mileage`).style('width'));
                    return full_width*(mileage/200);
                });
        }
    }
}