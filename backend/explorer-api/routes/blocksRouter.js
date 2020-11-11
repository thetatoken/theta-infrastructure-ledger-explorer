var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var BigNumber = require('bignumber.js');

var blockRouter = (app, blockDao, progressDao, checkpointDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  // @deprecated
  // router.get("/blocks/tmp", (req, res) => {
  //   let { type = 5, startTime = 0, endTime = 0 } = req.query;
  //   type = parseInt(type);
  //   blockDao.getInfoListByTimeAsync(startTime, endTime)
  //     .then(async infoList => {
  //       if (infoList && infoList.length < 15000) {
  //         let total = 0;
  //         let txs = [];
  //         infoList.forEach(info => {
  //           info.txs.forEach(tx => {
  //             if (tx.type === 5) txs.push(tx.hash);
  //           })
  //         })
  //         for (let hash of txs) {
  //           try {
  //             const tx = await transactionDao.getTransactionByPkAsync(hash);
  //             total += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
  //           } catch (e) {
  //             console.log('Error occurred while getting transaction in block tmp:' + hash);
  //           }
  //         }
  //         var data = ({
  //           total: total
  //         });
  //         res.status(200).send(data);
  //       } else {
  //         const err = ({
  //           type: 'error_bad_request',
  //           error
  //         });
  //         res.status(400).send(err);
  //       }
  //     })
  // })

  router.get("/block/:id", (req, res) => {
    let blockId = Number(req.params.id);
    let latest_block_height;
    console.log('Querying one block by using Id: ' + blockId);
    if (blockId > 0) {
      progressDao.getProgressAsync(config.blockchain.network_id)
        .then((progressInfo) => {
          latest_block_height = progressInfo.height;
          return blockDao.getBlockAsync(blockId)
        })
        .then(async blockInfo => {
          if (blockInfo.height % 100 === 1 && blockInfo.guardian_votes) {
            try {
              let checkpoint = await checkpointDao.getCheckpointByHashAsync(blockInfo.guardian_votes.Block);
              let voted = new BigNumber(0), deposited = new BigNumber(0), j = 0;
              for (let i = 0; i < checkpoint.guardians.length; i++) {
                let skip = true;
                checkpoint.guardians[i].Stakes.forEach(stake => {
                  skip = skip && stake.withdrawn;
                  let theta = !stake.withdrawn ? stake.amount : new BigNumber(0);
                  let multi = !blockInfo.guardian_votes.Multiplies[j] ? 0 : 1
                  voted = voted.plus(multi ? theta : 0);
                  deposited = deposited.plus(theta)
                })
                console.log(blockInfo.guardian_votes.Multiplies[j], j, blockInfo.guardian_votes.Multiplies.length)
                j += skip ? 0 : 1;
              }
              blockInfo.total_deposited_guardian_stakes = deposited;
              blockInfo.total_voted_guardian_stakes = voted;
            } catch (err) {
              console.log(err)
            };
          }
          delete blockInfo.guardian_votes;
          const data = ({
            type: 'block',
            body: blockInfo,
            totalBlocksNumber: latest_block_height
          });
          res.status(200).send(data);
        })
        .catch(error => {
          if (error.message.includes('NOT_FOUND')) {
            const err = {
              type: 'error_not_found',
              error
            };
            res.status(404).send(err);
          } else {
            console.log('ERR - ', error)
          }
        });
    } else {
      res.status(400).send({ type: 'invalid_height' });
    }

  });
  router.get("/blocks/top_blocks", (req, res) => {
    numberOfBlocks = 1;
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
          query_block_height_max = latest_block_height - (pageNumber - 1) * limit;
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
  router.get("/blocks/number/:h", (req, res) => {
    const { h } = req.params;
    const hour = Number.parseInt(h);
    if (hour > 720) {
      res.status(400).send('Wrong parameter.');
      return;
    }
    blockDao.getTotalNumberByHourAsync(hour)
      .then(number => {
        var data = ({
          type: 'block_number_by_hour',
          body: { total_num_block: number }
        });
        res.status(200).send(data);
      })
      .catch(err => {
        console.log('Error - Push total number of block', err);
      });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = blockRouter;