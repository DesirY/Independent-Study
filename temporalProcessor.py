'''
This class is used to process the temporal information for the three plans
'''
import datetime
from json import load
import math
from os import EX_OSFILE, O_APPEND
from types import new_class

from werkzeug.exceptions import PreconditionRequired
from BEBInfoProcessor import BEB_Info_Processor
from TIME import str_to_time

class Temporal_Processor:
    def __init__(self, opt):
        self.routes_opt = BEB_Info_Processor(2).BEB_info
 
    # get the position of a BEB at the given time, run_len: how long has the BEB go, coordinates: the whole route
    def get_BEB_pos(self, run_len, coordinates):
        acc_len = 0
        for coordinate in coordinates:
            x_1 = coordinate[0][0]
            y_1 = coordinate[0][1]
            x_2 = coordinate[1][0]
            y_2 = coordinate[1][1]
            acc_len += math.sqrt(math.pow(x_1-x_2, 2)+math.pow(y_1-y_2, 2))
            if acc_len > run_len:
                return {"lat": y_2, "lng": x_2}

    # get the number of BEB on route for each route at the give time
    # return: {route_id: opacity(num of BEB)}
    def get_BEB_on_route_num(self, time):
        result = {}

        routes = self.routes_opt['routes']
        for key in routes.keys():
            result[key] = 0
            for route in routes[key]['timePeriods']:
                start_time_ori = route['period'][0].split(':')
                end_time_ori = route['period'][1].split(':')
                start_time = datetime.datetime(2021, 11, 12, int(start_time_ori[0]), int(start_time_ori[1]))           
                end_time = datetime.datetime(2021, 11, 12, int(end_time_ori[0]), int(end_time_ori[1]))
                if time > start_time and time < end_time:
                    result[key] += 1

        # change the result into opacity
        for key in result.keys():
            if result[key] < 2:
                result[key] = 0.2
            else:
                result[key] = result[key]*0.1
        return result

    # get how many times the charging stations has been used
    # time  
    # return {chargingName: {number of charge: num, opacity: o}} 
    def get_Charging_used(self, time):
        result = {}

        chargin_stations = self.routes_opt['charging_station']

        for station_name in chargin_stations.keys():
            charge_num = 0
            station = chargin_stations[station_name]
            # check all period, if the start time has passed then charge for once
            periods = station['charging_periods']
            for period in periods:
                if time > str_to_time(period[0]):
                    charge_num += 1
            result[station_name] = {'charge_num': charge_num}
        
        # transform them in to opacity (48, 9, 3, 96)
        for key in result.keys():
            result[key]['opacity'] = 0.6+result[key]['charge_num']*0.4/90

        return result

    # get all BEB positions of a selected route at a given time and the information of this bus
    def get_BEBs_at_time(self, time, route_id_lst):
        result = []     # [{coorinates: {"lat": ,"lng": }, blockId: , ratio}]
        print('now_time', time)
        routes = self.routes_opt['routes']

        for route_id in route_id_lst:
            route = routes[route_id]
            route_coords = route['coordinates']

            for period_info in route['timePeriods']:
                start_time_ori = period_info['period'][0].split(':')
                end_time_ori = period_info['period'][1].split(':')
                start_time = datetime.datetime(2021, 11, 12, int(start_time_ori[0]), int(start_time_ori[1]))           
                end_time = datetime.datetime(2021, 11, 12, int(end_time_ori[0]), int(end_time_ori[1]))
                seq_miss = period_info['seq_miss']     # if miss sequence data

                if time > start_time and time < end_time:
                    # the ratio of this route
                    route_ratio = time.__sub__(start_time).seconds / (end_time.__sub__(start_time).seconds)
                    pos = self.get_BEB_pos(route_ratio*route['length'], route_coords)

                    if not seq_miss:
                        s_battery = period_info['s_battery']
                        e_battery = period_info['e_battery']     
                        battery = s_battery + (e_battery-s_battery)*route_ratio     # the remaining electricity
                        opacity = 0.4+0.6*battery   # the opacity of BEB
                        result.append({'blockId': period_info['block_num'], 'ratio': route_ratio, 'coordinates': pos, 'seq_miss': seq_miss, 'battery': battery, 'opacity': opacity})
                    else:
                        result.append({'blockId': period_info['block_num'], 'ratio': route_ratio, 'coordinates': pos, 'seq_miss': seq_miss})

            # print(result)
        return result

    # get the route infomation according to route_id and current time
    # {'LineAbbr': , 'Destinations': [des1, des2], 'BEBNum': }
    def get_route_info_at_time(self, time, route_id):
        route = self.routes_opt['routes'][route_id]
        LineAbbr = route_id
        Destinations = list(route['destinations'].keys())

        # get the number of BEB on this route at this time
        BEBNum = 0
        for period_info in route['timePeriods']:
            start_time_ori = period_info['period'][0].split(':')
            end_time_ori = period_info['period'][1].split(':')
            start_time = datetime.datetime(2021, 11, 12, int(start_time_ori[0]), int(start_time_ori[1]))           
            end_time = datetime.datetime(2021, 11, 12, int(end_time_ori[0]), int(end_time_ori[1]))
            if time > start_time and time < end_time:
                BEBNum += 1
        res = {'LineAbbr': LineAbbr, 'Destinations': Destinations, 'BEBNum': BEBNum}

        return res
    
    # get the charging station information at a specific time
    # {'location': stop_name, ‘chargeNum’: }
    def get_charging_info_at_time(self, time, charging_id):
        location = charging_id
        
        charge_num = 0
        station = self.routes_opt['charging_station'][charging_id]
        periods = station['charging_periods']
        for period in periods:
            if time > str_to_time(period[0]):
                charge_num += 1
        
        return {'location': location, 'chargeNum': charge_num}

    # get the charging station information at a specific time  
    # {'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': }
    def get_BEB_info_at_time(self, time, BEB_id):
        BEB = self.routes_opt['BEBs'][BEB_id]
        result = {'BEBId': BEB_id}
        
        for period_info in BEB['periods']:
            # find the time
            start_time_ori = period_info['period'][0].split(':')
            end_time_ori = period_info['period'][1].split(':')
            start_time = datetime.datetime(2021, 11, 12, int(start_time_ori[0]), int(start_time_ori[1]))           
            end_time = datetime.datetime(2021, 11, 12, int(end_time_ori[0]), int(end_time_ori[1]))
            
            if time > start_time and time <= end_time:
                # find the time
                seq_miss = True
                if 'seq_miss' in period_info:
                    seq_miss = period_info['seq_miss']
                direction = period_info['direction']
                t_next_des = end_time.__sub__(time).seconds/60
                result['direction'] = direction
                result['t_next_des'] = str(t_next_des)+'min'
                result['seq_miss'] = seq_miss

                if not seq_miss:
                    route_ratio = time.__sub__(start_time).seconds / (end_time.__sub__(start_time).seconds)
                    s_battery = period_info['s_battery']
                    e_battery = period_info['e_battery']     
                    battery = s_battery + (e_battery-s_battery)*route_ratio
                    s_mileage = period_info['s_mileage']
                    e_mileage = period_info['e_mileage']
                    mileage = s_mileage + (e_mileage-s_mileage)*route_ratio
                    result['battery'] = round(battery, 2)
                    result['mileage'] = round(mileage, 2)
                    result['status'] = 'On the route'
                break

            if time < start_time:
                seq_miss = True
                if 'seq_miss' in period_info:
                    seq_miss = period_info['seq_miss']
                result['seq_miss'] = seq_miss

                if not seq_miss:
                    s_battery = period_info['s_battery']
                    s_mileage = period_info['s_mileage']
                    result['battery'] = round(s_battery, 2)
                    result['mileage'] = round(s_mileage, 2)
                    result['status'] = 'On the stop'
                break

        return result
    
    # get the number of BEBs on all routes over time
    # return [[hours, minutes, number of BEB], ...]
    def get_BEBs_on_routes_over_time(self): 
        result = []    
        # get all of the periods of all routes in one day, then construct them into the format: [[timeStr, 0/1, number on routes], ...]
        all_periods = []
        for route_id in self.routes_opt['routes'].keys():
            route = self.routes_opt['routes'][route_id]
            for period in route['timePeriods']:
                start_time = period['period'][0]
                end_time = period['period'][1]
                all_periods.append([start_time, 0, 0])     # 0-startTime
                all_periods.append([end_time, 1, 0])      # 1-endtime
        
        # sort periods according to time
        def sort_Key(e):
            return str_to_time(e[0])
        all_periods.sort(key=sort_Key)

        # travese each periods and modify the number of routes 
        for period in all_periods:
            res = []
            time = period[0]
            end = period[1]
            res.append(int(time.split(':')[0]))
            res.append(int(time.split(':')[1]))

            if len(result) == 0:
                res.append(1)
            else:
                if end:
                    res.append(result[-1][-1]-1)
                else:
                    res.append(result[-1][-1]+1)

            result.append(res)
        
        return result


    # get the battery of this BEB over time
    # return [[hours, minutes, battery_status, mileage_status], ...]
    def get_BEB_battery_mileage_info_over_time(self, id):
        res = []

        periods = self.routes_opt['BEBs'][id]['periods']
        if_miss = periods[0]['seq_miss']
    
        if not if_miss:
            for period in periods:
                start_time = period['period'][0].split(':')
                end_time = period['period'][1].split(':')
                s_battery = period['s_battery']
                e_battery = period['e_battery']

                s_mileage = period['s_mileage']
                e_mileage = period['e_mileage']

                res.append([int(start_time[0]), int(start_time[1]), s_battery, s_mileage])     # 0-startTime
                res.append([int(end_time[0]), int(end_time[1]), e_battery, e_mileage])      # 1-endtime
        
        return res


    # get the BEB network nodes information 
    #{'BEBs': ['id': , served_routes: [], served_chargers: []], 'routes': ['id': ], 'chargers': ['id': ]}
    def get_BEB_network(self):
        networks = {'BEBs': [], 'routes': [], 'chargers': []}

        BEBs = self.routes_opt['BEBs']
        routes = self.routes_opt['routes']
        chargers = self.routes_opt['charging_station']

        for BEB_id in BEBs:
            BEB_info = {'id': BEB_id, 'served_chargers': BEBs[BEB_id]['served_charges'], 'served_routes': BEBs[BEB_id]['served_routes']}
            networks['BEBs'].append(BEB_info)
        
        for route_id in routes:
            networks['routes'].append({'id': route_id})
        
        for charger_id in chargers:
            networks['chargers'].append({'id': charger_id})
        
        return networks


    # get the BEB information at a given timestamp
    # [{'BEBId': , 'battery': , 'mileage': , 'direction': , 't_next_des': , 'seq_miss': }, ...]
    def get_BEB_table_dynamic_info(self, time):
        result = []
        # get all BEB
        BEBs = self.routes_opt['BEBs']
        for BEB_id in BEBs:
            result.append(self.get_BEB_info_at_time(time, BEB_id))
        
        return result
