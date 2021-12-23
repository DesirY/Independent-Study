'''
This file is used to process the original json data of a specific plan, into a json file that is more convenient, 
accessible, and info-rich for the interactions
'''
'''
'''
import json
import csv
import math
from os import confstr, pardir
from typing import Sequence

from werkzeug.wrappers import PlainRequest

class BEB_Info_Processor:
    def __init__(self, opt):
        self.opt = opt    # 1, 2, 3
        self.option_json = self.load_json_data('./data/plan'+str(opt)+'.json')  # the raw data
        self.route_ids = []
        self.BEB_ids = []
        self.BEB_info = {'routes': {}, 'BEBs': {}, 'charging_station': {}}
        self.BEB_info['routes'] = self.get_route_data()
        self.BEB_info['BEBs'] = self.get_BEB_data()
        self.BEB_info['charging_station'] = self.get_charging_data()
        self.BEB_sequences_info = self.rich_info_with_plan_txt()
        self.update_BEB_with_seq_info()     # add sequence attributes for the BEB_info[BEBs]
        self.update_Route_with_seq_info()   # update the periods according to the BEB info
        self.update_Route_with_chargers()   # update the chargers that serve the BEB


    # get the route data
    '''
    {
        LineName: {
            'coordinates': coordinates, 
            'timePeriods': [{'period': [line[6], line[8]], 'block_num': BEB_id, 'from_stop': from_stop, 'to_stop': to_stop, 'direction': DirectionName} ...],
            'length': ,
            'destinations': {from_stop: [name1, name2, ...], to_stop: [name1, name2, ...]},
            'served_BEB': [],
        }
    }
    '''
    def get_route_data(self):
        result = {}     # {LineName: {'coordinates': coordinates, 'timePeriods': [{'period': [line[6], line[8]], 'block_num': BEB_id}], 'length': }}
    
        option_route_json = self.option_json['Routes']
        option_BEBs_json = self.option_json['BEBs']

        # get all of the bus id
        for beb in option_BEBs_json:
            self.BEB_ids.append(beb['block_num'])
        
        # initialize all of the routes: coordinates and length
        for route in option_route_json['features']:
            line_abbr = route['properties']['LineAbbr']
            self.route_ids.append(line_abbr)
            coordinates = route['geometry']['coordinates']
            result[line_abbr] = {'coordinates': coordinates, 'timePeriods': []}
            # initialize the length for each route
            result[line_abbr]['length'] = self.get_route_length(coordinates)
            # initialize the destinations for each route
            result[line_abbr]['destinations'] = {}
        
        # initialize the route with runcut.csv file
        self.init_route_with_runcut(result)

        # initialize the served BEB in this route
        for route_id in result.keys():
            route = result[route_id]
            route['served_BEB'] = []
            # if 'served_BEB' not in route.keys():
            route_periods = route['timePeriods']
            for route_period in route_periods:
                block_num = route_period['block_num']
                if block_num not in route['served_BEB']:
                    route['served_BEB'].append(block_num)
            # print(result[route_id]['served_BEB'])

        return result
    
    # get the BEB data
    '''
    {
        block_num: {
            'served_routes': [],
            'periods': [{'period': [line[6], line[8]], 'block_num': BEB_id, 'from_stop': from_stop, 'to_stop': to_stop, 'direction': DirectionName}, {}, ...] order: the time order 
            'served_charges':[]
        }
    }
    '''
    def get_BEB_data(self):
        # sort the periods
        def getKey(ele):
            from_time = ele['period'][0].split(':')
            return int(from_time[0])+int(from_time[1])/60
        result = {}     
        
        option_BEBs_json = self.option_json['BEBs']
        routes = self.BEB_info['routes']
        
        # init all BEBs and the served_routes
        for BEB in option_BEBs_json:
            result[BEB['block_num']] = {'served_routes': BEB['lineAbbr'], 'periods': []}
        
        # init all of the periods
        for BEB_id in result.keys():
            served_routes = result[BEB_id]['served_routes']
            for served_route in served_routes:
                route = routes[served_route]
                for period in route['timePeriods']:
                    if period['block_num'] == BEB_id:
                        result[BEB_id]['periods'].append(period)
            # sort for all of the period
            result[BEB_id]['periods'].sort(key=getKey)
        
        return result

    # get the charging station data
    '''
    {
        station_name:{
            'coords': [],
            'charging_periods': []
        }
    }
    '''
    def get_charging_data(self):
        result = {}
        option_charging_json = self.option_json['Chargings']

        for charging_station in option_charging_json:
            charging_name = charging_station['charge_name']
            coords = charging_station['coords']
            result[charging_name] = {'coords': coords, 'charging_periods': []}

        return result


    # implement info with p25/.. .txt file: percentages of charge at the start stop and the end stop; 
    # accumulated distance at the start stop and the end stop; if charging?
    # [{'BEB_id': {'seq_miss': False, 'sequence_num': 10, 'raw_sequence':[], 'acc_sequence': [], 'charging_sequence': []}}, ...]
    def rich_info_with_plan_txt(self):
        BEB_sequences_info = {}   # {'BEB_id': {'seq_miss': False, 'sequence_num': 10, 'raw_sequence':[], 'acc_sequence': [], 'charging_sequence': []}}

        with open('./data/p60.txt', 'r') as f:
            next(f)
            for line in f.readlines():
                if line[0] == 'm':
                    acc = float(line.split()[1])
                    BEB_id = line.split()[0].split('_')[0][1:]
                    sequence_id = line.split()[0].split('_')[1]
                    
                    if BEB_id in self.BEB_ids:
                        if BEB_id in BEB_sequences_info.keys():
                            BEB_sequences_info[BEB_id]['sequence_num'] += 1
                            BEB_sequences_info[BEB_id]['raw_sequence'].append(acc)
                            BEB_sequences_info[BEB_id]['acc_sequence'].append(acc)
                            BEB_sequences_info[BEB_id]['charging_sequence'].append(acc)
                        else:
                            BEB_sequences_info[BEB_id] = {'seq_miss': False, 'sequence_num': 0, 'raw_sequence': [], 'acc_sequence': [], 'charging_sequence': []}    
        
        # test the result
        print('BEB num', len(BEB_sequences_info.keys()))
        print('real BEB num', len(self.BEB_ids))

        # set the unconsistent data as missing data
        for key in BEB_sequences_info.keys():
            if BEB_sequences_info[key]['sequence_num'] != len(self.BEB_info['BEBs'][key]['periods']):
                print('unconsistency:', key, 'BEB_sequences:', BEB_sequences_info[key]['sequence_num'], 'BEB_info:', len(self.BEB_info['BEBs'][key]['periods']))
                BEB_sequences_info[key] = {'seq_miss': True}
        
        # find the missing BEB
        for BEB_id in self.BEB_ids:
            if BEB_id not in BEB_sequences_info.keys():
                BEB_sequences_info[key] = {'seq_miss': True}

        # correct the information of 1.7599999999999735e+01
        # for key in BEB_sequences_info.keys():
        #     if not BEB_sequences_info[key]['seq_miss']:
        #         cnt = 0
        #         for num in BEB_sequences_info[key]['raw_sequence']:
        #             if abs(num - float('1.7763568394002505e-15')) < 0.0000000000000000000000001:
        #                 BEB_sequences_info[key]['raw_sequence'][cnt] = (BEB_sequences_info[key]['raw_sequence'][cnt-1] + BEB_sequences_info[key]['raw_sequence'][cnt + 1]) /2
        #                 BEB_sequences_info[key]['acc_sequence'][cnt] = (BEB_sequences_info[key]['acc_sequence'][cnt-1] + BEB_sequences_info[key]['raw_sequence'][cnt + 1]) /2
        #                 BEB_sequences_info[key]['charging_sequence'][cnt] = (BEB_sequences_info[key]['charging_sequence'][cnt-1] + BEB_sequences_info[key]['charging_sequence'][cnt + 1]) /2
        #             cnt += 1
           
        # get the acc_sequence and the charging_sequence
        for key in BEB_sequences_info.keys():
            if not BEB_sequences_info[key]['seq_miss']:
                add = 0
                elec_index = 0      # mark the index of the new charge
                for index, value in enumerate(BEB_sequences_info[key]['acc_sequence']):
                    if abs(value - 0.0) < 1e-20:
                        add = BEB_sequences_info[key]['acc_sequence'][index-1]
                        # update the ele_index 
                        max_dis = add
                        for i in range(elec_index, index):
                            BEB_sequences_info[key]['charging_sequence'][i] = (max_dis-BEB_sequences_info[key]['charging_sequence'][i])/max_dis
                        BEB_sequences_info[key]['charging_sequence'][index] = 1
                        elec_index = index + 1
                    elif len(BEB_sequences_info[key]['acc_sequence'])-1 == index:
                        # the last one
                        max_dis = value
                        for i in range(elec_index, index+1):
                            BEB_sequences_info[key]['charging_sequence'][i] = (max_dis-BEB_sequences_info[key]['charging_sequence'][i])/max_dis

                    BEB_sequences_info[key]['acc_sequence'][index] += add
            
        # for key in BEB_sequences_info.keys():
        #     print(BEB_sequences_info[key]['raw_sequence'])
        #     print(BEB_sequences_info[key]['charging_sequence'])
        return BEB_sequences_info

    # intialize the route with runcut.csv file: init all of time periods of this route and the destinations
    def init_route_with_runcut(self, routes):
        runcut = self.load_csv_data('./data/Runcut1.csv')

        for line in runcut:
            route_id = line[0]
            BEB_id = line[3]
            ServiceName = line[1]
            DirectionName = line[2]
            from_stop = line[5]
            FromTime = line[6]
            to_stop = line[7]
            ToTime = line[8]

            if (route_id in self.route_ids) and (BEB_id in self.BEB_ids) and (ServiceName == 'WEEKDAY'):
                time_period = {'period': [FromTime, ToTime], 'block_num': BEB_id, 'from_stop': from_stop, 'to_stop': to_stop, 'direction': DirectionName}
                routes[route_id]['timePeriods'].append(time_period)
                # get destinations {'des1': [name1, name2,...], 'des2': [name1, name2,...]}
                if DirectionName in routes[route_id]['destinations'].keys():
                    if to_stop not in routes[route_id]['destinations'][DirectionName]:
                        routes[route_id]['destinations'][DirectionName].append(to_stop)
                        if len(routes[route_id]['destinations'][DirectionName]) > 1:
                            print('one result is bigger than 1', routes[route_id]['destinations'][DirectionName])
                else:
                    routes[route_id]['destinations'][DirectionName] = [to_stop]
                if len(routes[route_id]['destinations'].keys()) > 2:
                    print('more than two directions!!!', routes[route_id]['destinations'])
        
        # implement the missing data
        if self.opt == 2:
            # the following three route only deteced one destinations
            routes['2']['destinations']['TO SL CENTRAL'] = ['300 S @ 600 W']
            routes['11']['destinations']['TO SL CENTRAL'] = ['300 S @ 600 W']
            routes['520']['destinations']['TO ROSE PARK'] = ['1000 N @ 1335 W']

    # update the BEB info with the sequence information: for each period, add attributes: seq_miss, s_battery, e_battery, s_mileage, e_mileage, ifCharging
    def update_BEB_with_seq_info(self):
        for BEB_id in self.BEB_sequences_info:
            if self.BEB_sequences_info[BEB_id]['seq_miss']:
                # set the attr 'seq_miss' of all periods under this BEB as true
                periods = self.BEB_info['BEBs'][BEB_id]['periods']
                for period in periods:
                    period['seq_miss'] = True
            else:
                periods = self.BEB_info['BEBs'][BEB_id]['periods']
                seq_acc_info = self.BEB_sequences_info[BEB_id]['acc_sequence']
                seq_charging_info = self.BEB_sequences_info[BEB_id]['charging_sequence']
                for index, period in enumerate(periods):
                    period['ifCharging'] = False
                    period['seq_miss'] = False
                    period['e_battery'] = seq_charging_info[index]
                    period['e_mileage'] = seq_acc_info[index]
                    if index == 0:
                        period['s_battery'] = 1
                        period['s_mileage'] = 0
                    else:             
                        period['s_battery'] = seq_charging_info[index-1]
                        period['s_mileage'] = seq_acc_info[index-1]
                        # if period['e_battery'] is 1, then charge at this stop
                    if abs(period['e_battery']-1) < 1e-10:
                        period['ifCharging'] = True
                        charging_station = period['to_stop']
                        # print('charg at:', charging_station)
                        # if charging_station == 'COTTONWOOD ST @ 5144 S':
                        #     # print(period)
                        #     # print(seq_charging_info)
                        self.BEB_info['charging_station'][charging_station]['charging_periods'].append(period['period'])
                #print(periods)
        # print('chargingStationSet:', self.BEB_info['charging_station'])

    # update the periods in route to match the period in BEBs
    def update_Route_with_seq_info(self):
        routes = self.BEB_info['routes']
        for line_abbre in routes.keys():
            periods = routes[line_abbre]['timePeriods']
            for index, period in enumerate(periods): 
                BEB_id = period['block_num']    # the block_num of the period
                period_time = period['period']  # [startTime, endTime]:[12:10, 20:10]

                # find the period in BEB 
                BEB_periods = self.BEB_info['BEBs'][BEB_id]['periods']
                find = False
                for BEB_index, BEB_period in enumerate(BEB_periods):
                    BEB_period_time = BEB_period['period']
                    if period_time[0] == BEB_period_time[0] and period_time[1] == BEB_period_time[1]:
                        periods[index] = BEB_period
                        find = True
                        break
                if not find:
                    print('no find this period!!!!', period)
            # test the result
            # print(self.BEB_info['routes'][line_abbre]['timePeriods'])
    
    # update the chargers for each BEB 'served_BEB': [],
    def update_Route_with_chargers(self):
        BEBs = self.BEB_info['BEBs']
        for BEB_id in BEBs:
            BEB = BEBs[BEB_id]
            BEB['served_charges'] = []
            for period in BEB['periods']:
                if 'ifCharging' in period.keys():
                    if period['ifCharging']:
                        if period['to_stop'] not in BEB['served_charges']:
                            BEB['served_charges'].append(period['to_stop'])
            print('chargers', BEB['served_charges'])

    # compute each length of the route
    def get_route_length(self, coordinates):
        result = 0
        for coordinate in coordinates:
            x_1 = coordinate[0][0]
            y_1 = coordinate[0][1]
            x_2 = coordinate[1][0]
            y_2 = coordinate[1][1]
            result += math.sqrt(math.pow(x_1-x_2, 2)+math.pow(y_1-y_2, 2))
        return result

    def load_json_data(self, path):
        result = {}
        with open(path, 'r') as f:
            result = json.load(f)
        return result
    
    def load_csv_data(self, path):
        result = []
        with open(path, 'r') as f:
            f_csv = csv.reader(f)
            next(f_csv)
            for line in f_csv:
                result.append(line)
        return result