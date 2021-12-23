from flask import Flask, jsonify, request, render_template, abort
from jinja2 import TemplateNotFound
from werkzeug.exceptions import PreconditionFailed
from temporalProcessor import Temporal_Processor
import json
import datetime

app = Flask(__name__)
app.config.from_object(__name__)

now_time = ''

@app.route('/')
def index():
    return render_template('index.html')

'''
When option changes, return the current map json and return the time bar chart data (BEBs_on_routes_over_time) 
'''
@app.route('/option', methods=['POST', 'GET'])
def option_response():
    opt = request.get_json()['opt']

    response = {}
    with open('./data/plan'+opt+'.json', 'r') as f:
        response = json.load(f)

    BEBs_distribution = temporal_Processor.get_BEBs_on_routes_over_time()

    networks = temporal_Processor.get_BEB_network()

    return jsonify({'opt': response, 'BEBsDtb': BEBs_distribution, 'BEB_info': temporal_Processor.routes_opt['BEBs']})

@app.route('/time', methods=['POST', 'GET'])
def time_change():
    global now_time
    # start_time = datetime.datetime(2021, 11, 12, 0, 0)
    time = request.get_json()['time']
    # ratio = request.get_json()['ratio']
    selectedRoutes = request.get_json()['selectedRoutes']
    # mnts = ratio*24*60
    # delta = datetime.timedelta(minutes=mnts)
    # now_time = start_time+delta
    now_time = datetime.datetime(2021, 11, 12, time[0], time[1])
    response1 = temporal_Processor.get_BEB_on_route_num(now_time)   # opacity
    charge_info = temporal_Processor.get_Charging_used(now_time)
    response2 = {}
    if len(selectedRoutes) != 0:
        response2 = temporal_Processor.get_BEBs_at_time(now_time, selectedRoutes)
    
    # get the dynamic information of all BEBs
    BEBs_dynamic_info = temporal_Processor.get_BEB_table_dynamic_info(now_time)

    return jsonify({'opacity': response1, 'BEBs': response2, 'C_stations': charge_info, 'BEB_table_info': BEBs_dynamic_info})

# double click on a route, and then highlight this route, and then reveal the bus on the route
@app.route('/Rclk', methods=['POST', 'GET'])
def route_click():
    # get the route id
    route_id_lst = [request.get_json()['routeNum']]
    # get the status of each bus on the route
    response = temporal_Processor.get_BEBs_at_time(now_time, route_id_lst)
    return jsonify(response)

# click the map elements, get the information of this ele, then reveal them in the popup'
# {type: 'route'/'BEB'/'charging_station', id: }
@app.route('/eleClick', methods=['POST', 'GET'])
def map_ele_click():
    paras = request.get_json()
    type = paras['type']
    id = paras['id']
    
    if type == 'route':
        response = temporal_Processor.get_route_info_at_time(now_time, id)
    elif type == 'BEB':
        response = temporal_Processor.get_BEB_info_at_time(now_time, id)
    elif type == 'charging_station':
        response = temporal_Processor.get_charging_info_at_time(now_time, id)

    return jsonify(response)


# double click the map elements, get the basic information of this ele, and the temporal information of 
# it, and then reveal these information in the detailed view
#
@app.route('/eleDBClick', methods=['POST', 'GET'])
def map_ele_dbclick():
    paras = request.get_json()
    type = paras['type']
    id = paras['id']

    basic_info = ''

    if type == 'route':
        basic_info = temporal_Processor.get_route_info_at_time(now_time, id)

    elif type == 'BEB':
        #  {'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': }
        basic_info = temporal_Processor.get_BEB_info_at_time(now_time, id)
        # [[hours, minutes, battery_status, mileage_status], ...]
        battery_mileage_info = temporal_Processor.get_BEB_battery_mileage_info_over_time(id)
        return jsonify({'basicInfo': basic_info, 'batteryMileageInfo': battery_mileage_info})

    elif type == 'charging_station':
        basic_info = temporal_Processor.get_charging_info_at_time(now_time, id)


if __name__ == '__main__':
    temporal_Processor = Temporal_Processor(2)
    temporal_Processor.get_BEBs_on_routes_over_time()
    app.debug = True 
    app.run(debug=True)