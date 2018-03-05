const aerospikeClient = require('./db/aerospike-client.js')
const blockDao = require('./db/block-dao.js')


aerospikeClient.init('172.28.128.3', '3000', 'test');

aerospikeClient.connect(function (error) {
  if (error) {
    console.log('Connection failed');
  } else {
    console.log('Connection succeeded');
  }
})

blockDaoInstance = new blockDao(aerospikeClient);
blockInfo = {
  height:      'a',
  timeStamp:   '10230123',
  hash:        '0x1234',
  parentHash:  '0x4321'
}

blockDaoInstance.upsertBlock(blockInfo, null);

blockDaoInstance.getBlock('a', (record) => {
  console.log('callback:'); console.log(record);
});



