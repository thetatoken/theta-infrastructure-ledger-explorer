var router = (app, blockDao, progressDao, config) => {
  // app.get("/", (req, res) => {
  //   res.status(200).send("Welcome to our restful API");
  // });

  app.get("/api/block/:id", (req, res) => {
    let blockId = req.params.id;
    console.log('Querying block by using Id' + blockId);
    blockDao.getBlockAsync(Number(blockId))
      .then(blockInfo => {
        var data = ({
          type: 'block',
          body: blockInfo
        });
        res.status(200).send(data);
      });
  });
  app.get("/api/blocks/top_blocks", (req, res) => {
    numberOfBlocks = 20;
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then((progressInfo) => {
        latest_block_height = progressInfo.height;
        console.log('Latest block height: ' + latest_block_height.toString());

        var query_block_height_max = latest_block_height;
        var query_block_height_min = Math.max(0, query_block_height_max - numberOfBlocks); // pushing 100 blocks initially
        console.log('REST api querying blocks from' + query_block_height_min.toString() + ' to ' + query_block_height_max.toString())
        //return blockDao.getBlockAsync(123) 
        return blockDao.getBlocksByRangeAsync(query_block_height_min, query_block_height_max)
      })
      .then(blockInfoList => {
        var data = ({
          type: 'block_list',
          body: blockInfoList
        });
        res.status(200).send(data);
      });
  })
  app.use('/api', router); 

}

module.exports = router;