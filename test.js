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



const Cron = require('.');

const options = {
    waitCycles: 10,
    // redis: YOUR REDIS INSTANCE,
    timeZone: 'America/Los_Angeles',
    redisKeyPrefix: "long-cron:cache:"
}

const cron = new Cron(options);

cron.start('each 1 seconds', async function() {

    console.time("Long Cron");
    console.log('Running Cron Job');

    await new Promise((resolve, reject) => {
        setTimeout(resolve, 5000);
    });

    console.timeEnd("Long Cron");


})