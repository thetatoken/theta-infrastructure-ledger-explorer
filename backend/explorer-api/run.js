var fs = require('fs')
var express = require('express');
var app = express();
var bluebird = require("bluebird");
var rpc = require('../crawler/api/rpc.js');
// var asClient = require('../db/aerospike-client.js')
var mongoClient = require('../mongo-db/mongo-client.js')
var blockDaoLib = require('../mongo-db/block-dao.js');
var progressDaoLib = require('../mongo-db/progress-dao.js');
var transactionDaoLib = require('../mongo-db/transaction-dao.js');
var accountDaoLib = require('../mongo-db/account-dao.js');
var accountTxDaoLib = require('../mongo-db/account-tx-dao.js');
var vcpDaoLib = require('../mongo-db/vcp-dao.js');

var blocksRouter = require("./routes/blocksRouter");
var transactionsRouter = require("./routes/transactionsRouter");
var accountRouter = require("./routes/accountRouter");
var accountTxRouter = require("./routes/accountTxRouter");
var vcpRouter = require("./routes/vcpRouter");
var supplyRouter = require("./routes/supplyRouter");
var cors = require('cors')
var io;
//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg';
var blockDao = null;
var isPushingData = false;
//------------------------------------------------------------------------------
//  Start from here
//------------------------------------------------------------------------------

main();

//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------

function main() {
  console.log('Loading config file: ' + configFileName);
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    console.log('Error: unable to load ' + configFileName);
    console.log(err);
    process.exit(1);
  }
  console.log(config);

  rpc.setConfig(config);
  bluebird.promisifyAll(rpc);

  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (err) {
    if (err) {
      console.log('Mongo connection failed');
      process.exit(1);
    } else {
      console.log('Mongo connection succeeded');
      blockDao = new blockDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(blockDao);
      progressDao = new progressDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(progressDao);
      transactionDao = new transactionDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(transactionDao);
      accountDao = new accountDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountDao);
      accountTxDao = new accountTxDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountTxDao);
      vcpDao = new vcpDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(vcpDao);
      //
      var privateKey = fs.readFileSync(config.cert.key, 'utf8');
      var certificate = fs.readFileSync(config.cert.crt, 'utf8');
      var options = {
        key: privateKey,
        cert: certificate
      };
      app.get('/ping', function (req, res) {
        console.log('Receive healthcheck /ping from ELB - ' + req.connection.remoteAddress);
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': 2
        });
        res.write('OK');
        res.end();
      });
      // start server program
      var server = require('https').createServer(options, app);
      io = require('socket.io')(server);

      io.on('connection', onClientConnect);
      // server.listen(config.server.port);
      server.listen('3030');

      app.use(cors());

      // app.use(bodyParser.json());
      // app.use(bodyParser.urlencoded({ extended: true }));

      var https = require('https').createServer(options, app);
      https.listen(config.server.port, () => {
        console.log("rest api running on port.", 9000);
      });
      // REST services
      // blocks router
      blocksRouter(app, blockDao, progressDao, config);
      // transactions router       
      transactionsRouter(app, transactionDao, progressDao, config);
      // account router
      accountRouter(app, accountDao, rpc, config);
      // account transaction mapping router
      accountTxRouter(app, accountTxDao, transactionDao, rpc, config);
      // vcp router
      vcpRouter(app, vcpDao, config);
      // supply router
      supplyRouter(app, config);
      // keep push block data
      // pushTopBlocks();
    }
  });
}

function onClientConnect(client) {
  console.log('client connected.');
  isPushingData = true;
  pushTopBlocks();
  pushTopTransactions();
  pushTotalTxsNum();
  // setup client event listeners
  client.on('disconnect', onClientDisconnect);
}

function pushTopBlocks() {
  const numberOfBlocks = 10;

  progressDao.getProgressAsync(config.blockchain.network_id)
    .then(function (progressInfo) {
      latest_block_height = progressInfo.height;
      // console.log('Latest block height: ' + latest_block_height.toString());

      var query_block_height_max = latest_block_height;
      var query_block_height_min = Math.max(0, query_block_height_max - numberOfBlocks + 1); // pushing 100 blocks initially
      console.log('Querying blocks from ' + query_block_height_min.toString() + ' to ' + query_block_height_max.toString())
      //return blockDao.getBlockAsync(123) 
      return blockDao.getBlocksByRangeAsync(query_block_height_min, query_block_height_max)
    })
    .then(function (blockInfoList) {
      io.sockets.emit('PUSH_TOP_BLOCKS', { type: 'block_list', body: blockInfoList });
    });

  if (isPushingData) setTimeout(pushTopBlocks, 1000);
}
function pushTopTransactions() {
  numberOfTransactions = 10;

  progressDao.getProgressAsync(config.blockchain.network_id)
    .then((progressInfo) => {
      latest_transaction_count = progressInfo.count;
      // console.log('Latest transaction count: ' + latest_transaction_count.toString());
      var query_txs_count_max = latest_transaction_count;
      var query_txs_count_min = Math.max(0, query_txs_count_max - numberOfTransactions + 1); // pushing 100 blocks initially
      console.log('Querying transactions from ' + query_txs_count_min.toString() + ' to ' + query_txs_count_max.toString())
      //return blockDao.getBlockAsync(123) 
      return transactionDao.getTransactionsAsync(query_txs_count_min, query_txs_count_max)
    })
    .then(function (transactionInfoList) {
      io.sockets.emit('PUSH_TOP_TXS', { type: 'transaction_list', body: transactionInfoList });
    });

  if (isPushingData) setTimeout(pushTopTransactions, 1000);
}

function pushTotalTxsNum() {
  transactionDao.getTotalNumberAsync()
    .then(number => {
      io.sockets.emit('PUSH_TOTAL_NUM_TXS', { type: 'total_number_transaction', body: { total_num_tx: number } });
    })
    .catch(err => {
      console.log('Error - Push total number of transaction', err);
    });
  if (isPushingData) setTimeout(pushTotalTxsNum, 1000);
}
function onClientDisconnect() {
  isPushingData = false;
  console.log('client disconnect');
}