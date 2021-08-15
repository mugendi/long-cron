
# Why

The [Cron](https://www.npmjs.com/package/cron) module is amazing! No doubt!

But sometimes you want to use it and at the same time prevent running jobs until the last run has finished. This is a tricky thing for heavy computational jobs where the completion time cannot be precisely determined prior to running the job.

This module is a thin wrapper on top of **Cron** that manages a map of running processes on redis and only allows the cron function to run once the last job is done.

Additionally, it adds a feature called **Wait Cycles** that allows job keys to be expired after a job has taken longer that ***cron-time x 10*** (or whatever value you set)

Finally I threw in the [Human to Cron](https://www.npmjs.com/package/human-to-cron) package because I prefer to work with human-readable crons.

## To use

``` yarn add long-cron```

Then...

```javascript
    
    //Require
    const Cron = require('long-cron');
    
    //Initialize with options
    const options = {
        //How long to wait to clear keys for hung jobs
        //One cycle is equal to your cron duration/interval
        waitCycles: 10,

        // You can optionally pass your own redis (client) interval
        // This module uses ioredis by default
        // redis: YOUR REDIS INSTANCE,

        //You can set your time zone here. Refer to the cron module
        timeZone: 'America/Los_Angeles',
        
        //Optional prefix for your redis keys. The default is as shown below
        redisKeyPrefix: "long-cron:cache:"
    }
    
  
    const cron = new Cron(options);
    
    // now run your cron!
    // pass the duration in human (see human-to-cron module) or as a cron pattern

    cron.start('each 1 seconds', async function() {
    
        console.time("Long Cron");
        console.log('Running Cron Job');
    
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        });
    
        console.timeEnd("Long Cron");
    
    
    })

```

This will output the following...

```txt
    Running Cron Job
    Long Cron: 5.003s
    Running Cron Job
    Long Cron: 5.000s
    Running Cron Job
    Long Cron: 5.001s
    Running Cron Job
    Long Cron: 5.001s
```

As shown in the output, even though the cron job is set to run **every one second** we actually only run the function once the last job has returned (after 5 seconds).

If this job was to hung, the keys preventing it to run would automatically expire after **1x10 seconds**.

It therefore means that when callig long running processes, set your cron interval and ```waitCycles``` to values that are reasonable based on the task at hand. 

Enjoy!