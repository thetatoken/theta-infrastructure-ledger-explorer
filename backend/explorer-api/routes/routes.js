var appRouter = (app, blockDao) => {
    app.get("/", (req, res) => {
      res.status(200).send("Welcome to our restful API");
    });

    app.get("/blocks/:id", function (req, res) {
        let blockId = req.params.id;
        console.log('Querying block by using Id' + blockId);
        blockDao.getBlocksByRangeAsync(Number(blockId), Number(blockId))
        .then( blockInfoList => {
            var data = ({
                type: 'block_list', 
                body: blockInfoList
            });
            res.status(200).send(data);
        });
      });
  }
  
  module.exports = appRouter;