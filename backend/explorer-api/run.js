var fs = require('fs')
var express = require('express');
var app = express();
var compression = require('compression')

var bluebird = require("bluebird");
var rpc = require('./api/rpc');
var mongoClient = require('../mongo-db/mongo-client.js')
var blockDaoLib = require('../mongo-db/block-dao.js');
var progressDaoLib = require('../mongo-db/progress-dao.js');
var transactionDaoLib = require('../mongo-db/transaction-dao.js');
var accountDaoLib = require('../mongo-db/account-dao.js');
var accountTxDaoLib = require('../mongo-db/account-tx-dao.js');
var accountTxSendDaoLib = require('../mongo-db/account-tx-send-dao.js');
var stakeDaoLib = require('../mongo-db/stake-dao.js');
var subStakeDaoLib = require('../mongo-db/sub-stake-dao.js');
var priceDaoLib = require('../mongo-db/price-dao.js');
var txHistoryDaoLib = require('../mongo-db/tx-history-dao.js');
var accountingDaoLib = require('../mongo-db/accounting-dao.js');
var checkpointDaoLib = require('../mongo-db/checkpoint-dao.js');
var smartContractDaoLib = require('../mongo-db/smart-contract-dao.js')
var activeAccountDaoLib = require('../mongo-db/active-account-dao.js')
var rewardDistributionDaoLib = require('../mongo-db/reward-distribution-dao.js')
var dailyTfuelBurntDaoLib = require('../mongo-db/daily-tfuel-burnt-dao')
var stakeHistoryDaoLib = require('../mongo-db/stake-history-dao.js')
var tokenDaoLib = require('../mongo-db/token-dao.js')
var tokenSummaryDaoLib = require('../mongo-db/token-summary-dao.js')
var tokenHolderDaoLib = require('../mongo-db/token-holder-dao.js')

var Theta = require('./libs/Theta');

var blocksRouter = require("./routes/blocksRouter");
var transactionsRouter = require("./routes/transactionsRouter");
var accountRouter = require("./routes/accountRouter");
var accountTxRouter = require("./routes/accountTxRouter");
var stakeRouter = require("./routes/stakeRouter");
var priceRouter = require("./routes/priceRouter");
var accountingRouter = require("./routes/accountingRouter");
var supplyRouter = require("./routes/supplyRouter");
var smartContractRouter = require("./routes/smartContractRouter");
var activeActRouter = require("./routes/activeActRouter");
var rewardDistributionRouter = require("./routes/rewardDistributionRouter");
var tokenRouter = require("./routes/tokenRouter");
var cors = require('cors');
var io;
//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var Redis = require("ioredis");
var redis = null;
var redisConfig = null;

var config = null;
var configFileName = 'config.cfg';
var blockDao = null;

var progressDao = null
var transactionDao = null;
var accountDao = null;
var accountTxDao = null;
var accountTxSendDao = null;
var stakeDao = null;
var subStakeDao = null;
var priceDao = null;
var txHistoryDao = null;
var accountingDao = null;
var checkpointDao = null;
var smartContractDao = null;
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

  rpc.setConfig(config);
  bluebird.promisifyAll(rpc);

  Theta.chainId = config.defaultThetaChainID;
  console.log('Theta.chainId:', Theta.chainId);

  redisConfig = config.redis;
  if (redisConfig && redisConfig.enabled) {
    redis = redisConfig.isCluster ? new Redis.Cluster([
      {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    ], {
      redisOptions: {
        password: redisConfig.password,
      }
    }) : new Redis(redisConfig);
    bluebird.promisifyAll(redis);
    redis.on("connect", () => {
      console.log('connected to Redis');
    });
  }

  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (err) {
    if (err) {
      console.log('Mongo connection failed');
      process.exit(1);
    } else {
      console.log('Mongo connection succeeded');
      blockDao = new blockDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(blockDao);
      progressDao = new progressDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(progressDao);
      transactionDao = new transactionDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(transactionDao);
      accountDao = new accountDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountDao);
      accountTxDao = new accountTxDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountTxDao);
      accountTxSendDao = new accountTxSendDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountTxSendDao);
      stakeDao = new stakeDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(stakeDao);
      subStakeDao = new subStakeDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(subStakeDao);
      priceDao = new priceDaoLib(__dirname, mongoClient, redis);
      bluebird.promisifyAll(priceDao);
      txHistoryDao = new txHistoryDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(txHistoryDao);
      accountingDao = new accountingDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(accountingDao);
      checkpointDao = new checkpointDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(checkpointDao);
      smartContractDao = new smartContractDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(smartContractDao);
      activeActDao = new activeAccountDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(activeActDao);
      rewardDistributionDao = new rewardDistributionDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(rewardDistributionDao);
      dailyTfuelBurntDao = new dailyTfuelBurntDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(dailyTfuelBurntDao);
      stakeHistoryDao = new stakeHistoryDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(stakeHistoryDao);
      tokenDao = new tokenDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(tokenDao);
      tokenSummaryDao = new tokenSummaryDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(tokenSummaryDao);
      tokenHolderDao = new tokenHolderDaoLib(__dirname, mongoClient);
      bluebird.promisifyAll(tokenHolderDao);
      //

      app.use(compression());
      app.use(cors());
      app.use(setApiToken);

      app.get('/ping', function (req, res) {
        console.log('Receive healthcheck /ping from ELB - ' + req.connection.remoteAddress);
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': 2
        });
        res.write('OK');
        res.end();
      });


      var options = {};
      var restServer, socketIOServer;

      if (config.cert && config.cert.enabled) {
        var privateKey = fs.readFileSync(config.cert.key, 'utf8');
        var certificate = fs.readFileSync(config.cert.crt, 'utf8');
        options = {
          key: privateKey,
          cert: certificate
        };
        var spdy = require('spdy');
        restServer = spdy.createServer(options, app);
        socketIOServer = spdy.createServer(options, app);
      } else {
        var http = require('http');
        restServer = http.createServer(app);
        socketIOServer = http.createServer(app);
      }

      // start server program
      io = require('socket.io')(socketIOServer);
      io.on('connection', onClientConnect);

      socketIOServer.listen(config.server.socketIOPort || '2096', () => {
        console.log("socket.IO api running on port.", config.server.socketIOPort || '2096');
      });

      // app.use(bodyParser.json());
      // app.use(bodyParser.urlencoded({ extended: true }));

      restServer.listen(config.server.port, () => {
        console.log("rest api running on port.", config.server.port);
      });

      // blocks router
      blocksRouter(app, blockDao, progressDao, checkpointDao, config);
      // transactions router       
      transactionsRouter(app, transactionDao, blockDao, progressDao, txHistoryDao, config);
      // account router
      accountRouter(app, accountDao, tokenDao, rpc, config);
      // account transaction mapping router
      accountTxRouter(app, accountDao, accountTxDao, transactionDao);
      // stake router
      stakeRouter(app, stakeDao, subStakeDao, blockDao, accountDao, progressDao, stakeHistoryDao, config);
      // supply router
      supplyRouter(app, progressDao, dailyTfuelBurntDao, rpc, config);
      // price router
      priceRouter(app, priceDao, progressDao, config)
      // accounting router
      accountingRouter(app, accountingDao)
      // smart contract router
      smartContractRouter(app, smartContractDao, transactionDao, accountTxDao, tokenDao, tokenSummaryDao, tokenHolderDao)
      // active account router
      activeActRouter(app, activeActDao);
      // reward distribution router
      rewardDistributionRouter(app, rewardDistributionDao);
      // token router
      tokenRouter(app, tokenDao, tokenSummaryDao, tokenHolderDao, config);
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
  const numberOfBlocks = 5;

  progressDao.getProgressAsync(config.blockchain.networkId)
    .then(function (progressInfo) {
      latest_block_height = progressInfo.height;
      // console.log('Latest block height: ' + latest_block_height.toString());

      var query_block_height_max = latest_block_height;
      var query_block_height_min = Math.max(0, query_block_height_max - numberOfBlocks + 1); // pushing 50 blocks initially
      // console.log('Querying blocks from ' + query_block_height_min.toString() + ' to ' + query_block_height_max.toString())
      //return blockDao.getBlockAsync(123) 
      return blockDao.getBriefBlocksByRangeAsync(query_block_height_min, query_block_height_max)
    })
    .then(function (blockInfoList) {
      io.sockets.emit('PUSH_TOP_BLOCKS', { type: 'block_list', body: blockInfoList });
    });

  if (isPushingData) setTimeout(pushTopBlocks, 1000);
}
function pushTopTransactions() {
  const numberOfTransactions = 5;
  transactionDao.getBriefTransactionsAsync(0, numberOfTransactions)
    .then(function (transactionInfoList) {
      io.sockets.emit('PUSH_TOP_TXS', { type: 'transaction_list', body: transactionInfoList });
    });
  if (isPushingData) setTimeout(pushTopTransactions, 1000);
}

function pushTotalTxsNum() {
  transactionDao.getTotalNumberByHourAsync(null)
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

function setApiToken(req, res, next) {
  const apiToken = req.header('x-api-token');
  if (apiToken !== undefined) {
    res.setHeader('x-api-token', apiToken);
  }
  next();
}