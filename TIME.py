'''
transform string in to Time
'''

import datetime

# input: 12:00
def str_to_time(time_str):
    time_lst = time_str.split(':')
    return datetime.datetime(2021, 11, 12, int(time_lst[0]), int(time_lst[1]))