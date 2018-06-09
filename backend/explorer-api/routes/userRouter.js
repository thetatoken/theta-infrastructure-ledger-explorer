var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var userRouter = (app, userDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  router.get("/user/:address", (req, res) => {
    let address = req.params.address;
    console.log('Querying one User by using address: ' + address);
    const data = ({
        type: 'user',
        body: {
            address,
            balance: 'many'
        },
    });
    res.status(200).send(data);
    // userDao.getUserByPkAsync(address)
    //   .then(userInfo => {
    //     const data = ({
    //       type: 'user',
    //       body: userDao,
    //     });
    //     res.status(200).send(data);
    //   })
    //   .catch(error => {
    //     switch (error.code) {
    //       // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
    //       // No record is found with the specified namespace/set/key combination.
    //       case 2:
    //         const err = ({
    //           type: 'error_not_found',
    //           error
    //         });
    //         // var blockInfo = {};
    //         // blockInfo.error = 'Not Found';
    //         res.status(200).send(err);
    //         break
    //       default:
    //         console.log('ERR - ', err)
    //     }
    //   });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = userRouter;