import requests
import json
import urllib.request

POST_URL = 'http://pagebot2018.herokuapp.com/addstore'
data = ''

with open('stores.json', 'r') as file:
    stores = json.load(file)
    for store in stores:
        if not store['done']:
            store['location'] = {'coordinates': [ float(store['long']), float(store['lat']) ]}
        # if store['done'] is True:
            # store['done'] = False
            dat = {'store': json.dumps(store)}
            requests.post(POST_URL, data = (dat))
            store['done'] = True
        # break
    data = stores
    file.close()

with open('stores.json', 'w') as file:
    json.dump(data, file)
    file.close()