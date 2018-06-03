# PageBot

A location-based customer support Messenger bot.

PageBot asks for your location and matches it with supported business nearby. Once a store is found, PageBot will connect you to an avaiable customer support staff at the business, allowing you to chat or meet up with them.

# API

### Add Store 

**URL**: `/addstore`     
**METHOD**: `POST`    
**AUTH**: None   
**DATA EXAMPLE**: 
```
{ store: "{
    	"name": "Cole Hardware", 
    	"location": {
        	"type": "Point",
           	"coordinates": [-122.404893, 37.784737]
        }
     }"     
}
```
*Note that data MUST be formatted as JSON as a string. Coordinates are in the format `[long, lat]`. The `type` parameter is optional -- if not provided, the location will be assumed to be of type `"Point"`.*

**SUCCESS**: `200 OK`    
**ERROR**: `500 ERROR`
 
 ---
 
### Test

**URL**: `/test`    
**METHOD**: `POST`    
**AUTH**: None    
Any data is welcome. Output will be logged. Say hi 🙋 (we won't respond though) 
