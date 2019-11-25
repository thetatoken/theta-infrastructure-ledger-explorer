var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var vcpRouter = (app, vcpDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  
  router.get("/vcp/all", (req, res) => {
    console.log('Querying all vcp.');
    vcpDao.getAllVcpAsync()
      .then(vcpListInfo => {
        const data = ({
          type: 'vcp',
          body: vcpListInfo,
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  router.get("/vcp/:id", (req, res) => {
    console.log('Querying vcp by address.');
    const address = req.params.id.toLowerCase();
    vcpDao.getVcpByAddressAsync(address)
      .then(vcpListInfo => {
        const data = ({
          type: 'vcp',
          body: vcpListInfo,
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = vcpRouter;