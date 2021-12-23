/**
 * This script is used to set listen the change of option
 */

// the [Budget, BEBs, Environment cost] of three options
const optionSetting = {1: ['$25 million', 26, 2.27e+06], 2: ['$60 million', 63, 4.44e+06], 3: ['$12 million', 122, 5.70e+06]};

/**
 * result: {'opt': response, 'BEBsDtb': BEBs_distribution}
 */
d3.select('#selectForm').on('change', function(event){
    let val = d3.select(this).node().value;
    let option = optionSetting[val];

    axios.post("/option", {opt: val})
        .then((result) => {
            console.log(result);
            renderMapEles(map, result.data['opt']);
            renderTimeBarChart(result.data['BEBsDtb']);   // render the time bar chart
            renderBEBTable(result.data['BEB_info']);       // render the BEB table
            //renderNetwork(result.data['networks'])
            // update three values 
            d3.select('#budgetValue').text(option[0]);
            d3.select('#BEBValue').text(option[1]);
            d3.select('#envValue').text(option[2]);
        }).catch((err) => {
            console.log(err.response);
        });
    // update the map
    // renderMapEles(map, val);
 })

