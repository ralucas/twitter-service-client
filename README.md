Abstraction Service Client for the twitter api
---

### To create a client:
- `createTwitterClient`
- Example:

```
var twitterService = require('twitter-service-client');

twitterService.createTwitterClient(configuration)
  .then(function(twitterClient) {
    // use twitterClient methods here
  });
```

### Methods:
- `callRest` -- call the REST Api
- `getStream` -- call the Streaming Api


