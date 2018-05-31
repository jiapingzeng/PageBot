import requests
import json

POST_URL = 'http://pagebot2018.herokuapp.com/addstore'
data = ''

with open('stores.json', 'r') as file:
    stores = json.load(file)
    for store in stores:
        if 'coordinates' not in store:
            store['coordinates'] = [store['lat'], store['long']]
        if ('done' not in store) or store['done'] is False:
            requests.post(POST_URL, data = json.dumps(store))
            store['done'] = True
    data = stores
    file.close()

with open('stores.json', 'w') as file:
    json.dump(data, file)
    file.close()