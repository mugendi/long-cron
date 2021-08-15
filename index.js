// Copyright 2021 Anthony Mugendi
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.// Copyright 2021 Anthony Mugendi
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const crypto = require('crypto'),
    humanToCron = require('human-to-cron'),
    CronJob = require('cron').CronJob,
    cronParser = require('cron-parser'),
    Redis = require('ioredis'),
    redis = new Redis();

class Cron {
    constructor(opts) {

        let self = this;

        this.redis = redis;
        this.waitCycles = 10;
        this.timeZone = 'America/Los_Angeles';
        this.redisKeyPrefix = "long-cron:cache:";


        self = Object.assign(self, opts);

    }

    __is_valid_cron(exprStr) {
        return /([\*0-9\/]+\s*){5,6}/.test(exprStr)
    }

    __validate_cron(cronStr) {

        if (this.__is_valid_cron(cronStr) == false) {
            cronStr = humanToCron(cronStr);
        }

        return this.__is_valid_cron(cronStr) ? cronStr : null;

    }

    __redis_key(string) {

        // we generate an md5 hash for the argv + stringified cron function
        let fnStr = this.cronFn.toString(),
            argvStr = process.argv.join('~'),
            hashStr = argvStr + '~' + fnStr,
            fnHash = crypto.createHash('md5').update(hashStr).digest("hex"),
            redisKey = this.redisKeyPrefix + fnHash;

        return redisKey;
    }

    // Not all redis modules are fully async, this method handles that
    __redis_cmd(cmd, args) {

        return new Promise((resolve, reject) => {

            redis[cmd](...args, function(err, resp) {

                if (err) return reject(err);
                resolve(resp)

            })

        });

    }

    async __run_cron() {

        // make hash of the function
        let thisRedisKey = this.__redis_key(this.cronFn.toString());

        // if not last function is still running
        let isRunning = await this.__redis_cmd('get', [thisRedisKey]).then((resp) => resp ? true : false);


        if (isRunning) {

            // check if key has expiry
            let keyExpiry = await this.__redis_cmd('ttl', [thisRedisKey]);

            // if no expiry set
            if (keyExpiry == -1) {

                // We need a way to exit busy status, so we set this key to automatically expire after x cron cycles
                // This assumes that the task will definitely be finished by this time

                // set expiry
                this.cronInterval = cronParser.parseExpression(this.cronPattern);

                let nextCronDate;
                // skip x cycles 
                for (let i = 0; i < this.waitCycles; i++) {
                    nextCronDate = this.cronInterval.next().toDate();
                }

                // get expire at in seconds
                let expiresAtTS = Math.floor(nextCronDate.getTime() / 1000);


                // expire key at this time
                await this.__redis_cmd('expireat', [thisRedisKey, expiresAtTS]);

            }


            return
        };


        // set redis key
        await this.__redis_cmd('set', [thisRedisKey, 1])

        // run cron function now with await to handle both async & sync functions
        await this.cronFn();

        // delete key
        this.__redis_cmd('del', [thisRedisKey]);


    }

    start(cronStr, fn) {

        if (typeof cronStr !== 'string') throw new Error(`The cronStr argument must be a string`);
        if (typeof fn !== 'function') throw new Error(`The Fn argument must be a function`)

        // validate and parse cron pattern
        this.cronPattern = this.__validate_cron(cronStr);

        this.cronFn = fn;

        //  the cron function
        new CronJob(
            this.cronPattern,
            this.__run_cron.bind(this),
            null,
            true,
            this.timeZone).start();

    }


}

module.exports = Cron