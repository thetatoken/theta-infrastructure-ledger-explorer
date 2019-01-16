var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var blockRouter = (app, blockDao, progressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  router.get("/block/:id", (req, res) => {
    let blockId = req.params.id;
    let latest_block_height;
    console.log('Querying one block by using Id: ' + blockId);
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then((progressInfo) => {
        latest_block_height = progressInfo.height;
        return blockDao.getBlockAsync(Number(blockId))
      })
      .then(blockInfo => {
        const data = ({
          type: 'block',
          body: blockInfo,
          totalBlocksNumber: latest_block_height
        });
        res.status(200).send(data);
      })
      .catch(error => {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            const err = ({
              type: 'error_not_found',
              error
            });
            res.status(200).send(err);
            break
          default:
            console.log('ERR - ', error)
        }
      });
  });
  router.get("/blocks/top_blocks", (req, res) => {
    numberOfBlocks = 10;
    let totalPageNumber, pageNumber = 1;
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then((progressInfo) => {
        latest_block_height = progressInfo.height;
        console.log('Latest block height: ' + latest_block_height.toString());
        var query_block_height_max = latest_block_height;
        var query_block_height_min = Math.max(0, query_block_height_max - numberOfBlocks + 1); // pushing 100 blocks initially
        totalPageNumber = Math.ceil(latest_block_height / req.query.limit);
        if (req.query.pageNumber !== undefined && req.query.limit !== undefined) {
          const { limit } = req.query;
          pageNumber = req.query.pageNumber;
          query_block_height_max = latest_block_height - pageNumber * limit;
          query_block_height_min = Math.max(0, query_block_height_max - limit + 1);
        }
        console.log('REST api querying blocks from ' + query_block_height_min.toString() + ' to ' + query_block_height_max.toString())
        //return blockDao.getBlockAsync(123) 
        return blockDao.getBlocksByRangeAsync(query_block_height_min, query_block_height_max)
      })
      .then(blockInfoList => {
        var data = ({
          type: 'block_list',
          body: blockInfoList,
          totalPageNumber,
          currentPageNumber: pageNumber
        });
        res.status(200).send(data);
      });
  })
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = blockRouter;