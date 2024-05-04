# API Reference

The **Theta Explorer APIs** is provided by the Theta Explorer Microservice Node. It is the REST interface via which a user can interact with the Theta Explorer Microservice Node directly. 

## Table of Contents

- [Theta Explorer APIs](#theta-explorer-apis)
	- [Block APIs](#block-apis)
    	- [GetBlock](#getblock)
		- [GetBlocksByRange](#getblocksbyrange)
	- [Transaction APIs](#transaction-apis)
		- [GetTransaction](#gettransaction)
		- [GetTransactionsByRange](#gettransactionsbyrange)
      - [GetTransactionsByBlockRange](#gettransactionsbyblockrange)
	- [Account APIs](#account-apis)
		- [GetAccount](#getaccount)
      - [GetAccountTxHistory](#getaccounttxhistory)
      - [GetTopTokenHolders](#gettoptokenholders)
   - [Stake APIs](#stake-apis)
      - [GetAllStakes](#getallstakes)
      - [GetTotalStakedAmount](#gettotalstakedamount)
      - [GetStakeByAddress](#getstakebyaddress)
   - [Supply APIs](#supply-apis)
		- [GetThetaAmount](#getthetaamount)
      - [GetTFuelAmount](#gettfuelamount)
   - [Token APIs](#token-apis)
		- [GetTokenSummary](#gettokensummary)
      - [GetTokenTransactions](#gettokentransactions)

## Theta Explorer APIs

## Block APIs

### GetBlock

This API returns the details of the block being queried with height.

**REST Uri**: /block/:height

**Returns**

- epoch: epoch of the block
- height: height of the block
- parent: hash of the parent block
- transactions_hash: root hash of the transaction Merkle-Patricia trie
- state_hash: root hash of the state Merkle-Patricia trie
- timestamp: timestamp when the block was proposed
- proposer: address of the proposer validator
- hash: the block hash
- transactions: json representation of the transactions contained in the block
	- raw: transaction details
	- type: type of the transaction (see the **Transaction Types** note below)
	- hash: hash of the transaction
- status: status of the block (see the **Block Status** note below)

**Transaction Types**

```
0: coinbase transaction, for validator/guardian reward
1: slash transaction, for slashing malicious actors
2: send transaction, for sending tokens among accounts
3: reserve fund transaction, for off-chain micropayment
4: release fund transaction, for off-chain micropayment
5: service payment transaction, for off-chain micropayment
6: split rule transaction, for the "split rule" special smart contract
7: smart contract transaction, for general purpose smart contract
8: deposit stake transaction, for depositing stake to validators/guardians
9: withdraw stake transaction, for withdrawing stake from validators/guardians
```

**Block Status**

```
0: pending 
1: valid
2: invalid
3: committed
4: directly finalized
5: indirectly finalized
6: trusted (the first block in a verified snapshot is marked as trusted)
```
A block and all the transactions included in the block are considered Finalized by the validators if the block status is **either 4, 5, or 6**

```
Block status transitions:

+-------+          +-------+                          +-------------------+
|Pending+---+------>Invalid|                    +----->IndirectlyFinalized|
+-------+   |      +-------+                    |     +-------------------+
            |                                   |
            |      +-----+        +---------+   |     +-----------------+
            +------>Valid+-------->Committed+---+----->DirectlyFinalized|
                   +-----+        +---------+         +-----------------+

```
**Example**
```
// Request
curl https://explorer-api.thetatoken.org/api/block/1

// Result
{  
   "type":"block",
   "body":{  
      "epoch":"1",
      "status":5,
      "height":1,
      "timestamp":"1550089775",
      "hash":"0x705b74cde1ad4afefb8cae883327b216dd11c3a4b592b4487a40337e5e27a7bd",
      "parent_hash":"0x8ce72f57b6ef53c7d5d144a40d6faacc444e9cd60d79043ea5ab978f44c120c6",
      "proposer":"0x9f1233798e905e173560071255140b4a8abd3ec6",
      "state_hash":"0xcb9b1641ecb9f1fb372a9ac9184c811c07bda3d061ce63b2c2e2f1fafc42c789",
      "transactions_hash":"0x36449d6d0523379a6799843cea98c0a4d708a7c314d0536496a78dee57fcb672",
      "num_txs":1,
      "txs":[  
         {  
            "raw":{  
               "proposer":{  
                  "address":"0x9f1233798e905e173560071255140b4a8abd3ec6",
                  "coins":{  
                     "thetawei":"0",
                     "tfuelwei":"0"
                  },
                  "sequence":"0",
                  "signature":"0xe54784005c1c321092d24ba50a32228b7b7b6d4e5ad41aa968e96123f1996f623aa609ab7414995aaa25eb8897ca2bb3809695e31829d5de2ee94eead3907eda00"
               },
               "outputs":[  
                  {  
                     "address":"0x2e833968e5bb786ae419c4d13189fb081cc43bab",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0x350ddef232565b32e66a9fb69780e85b686a9e1d",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0x5f74e3d5cc77b66f0030c5501cfbd39dcb8ff5b6",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0x7631958d57cf6a5605635a5f06aa2ae2e000820e",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0x9f1233798e905e173560071255140b4a8abd3ec6",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0xc15e24083152dd76ae6fc2aeb5269ff23d70330b",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  },
                  {  
                     "address":"0xdfb095b990c98a96dd434fe45cd040ec2167c228",
                     "coins":{  
                        "thetawei":"0",
                        "tfuelwei":"0"
                     }
                  }
               ],
               "block_height":"0"
            },
            "type":0,
            "hash":"0x72738626b99c6942daea0a04eaaca4d83d1d72e1620a0c55d35a886dcb0f56b1"
         }
      ]
   },
   "totalBlocksNumber":17164
}
```
### GetBlocksByRange

This API returns a list of block of given the page number and limit number. 

**REST Uri**: /blocks/top_blocks

**Query Parameters**

- pageNumber: the page number, 1 stands for the latest
- limit: the limit size of each page

**Returns**

- currentPageNumber: the number of current page
- For each block it is similar to the returns of the GetBlock API. Please [see above](#getblock).

**Example**

In this example, we query the blocks with page number 0 and page size 10.

```
// Request
curl https://explorer-api.thetatoken.org/api/blocks/top_blocks?pageNumber=1&limit=10

// Result
{  
   "type":"block_list",
   "body":[  
      {  
         "epoch":"17475",
         "status":4,
         "height":17449,
         "timestamp":"1550199501",
         "hash":"0x4756f30fa538769e4dcaae9fcbd19f6612b05abc843aa9c07a28983121fb3b1d",
         "parent_hash":"0xdd3fde69f68d8b9522adab25f04459f84072a160c2ab3ceeb086777550378e7f",
         "proposer":"0xc15e24083152dd76ae6fc2aeb5269ff23d70330b",
         "state_hash":"0x9711aadb58db9b33ac2f8e29584d772184b01b8406bc2c7cda52a024eeabba8a",
         "transactions_hash":"0xa90c99ab4a3861cfd2a71280a2f74f4aadda5727b72f046687681adfe31c3b5e",
         "num_txs":7,
         "txs":[...]
      },
      {  
         "epoch":"17476",
         "status":4,
         "height":17450,
         "timestamp":"1550199507",
         "hash":"0xb5997adcd3daf6c249b2e4ae79945d36fc1aa262fc344a5c665193460c4c2fec",
         "parent_hash":"0x4756f30fa538769e4dcaae9fcbd19f6612b05abc843aa9c07a28983121fb3b1d",
         "proposer":"0x9f1233798e905e173560071255140b4a8abd3ec6",
         "state_hash":"0x69407583b370cbc8c27c63f975e0a3145f05068f8a488d7411ed634f1544fefc",
         "transactions_hash":"0x1ff24e55b5c2e1a9e01ced5d7f92fe2dde90511e7b5cb28e93ed8751df721bda",
         "num_txs":5,
         "txs":[...]
      },
      {  
         "epoch":"17477",
         "status":4,
         "height":17451,
         "timestamp":"1550199513",
         "hash":"0x082b3653ccc74b26612da4a7666b2c3e9c2ce2222dd90c6083884892a0e3f1c6",
         "parent_hash":"0xb5997adcd3daf6c249b2e4ae79945d36fc1aa262fc344a5c665193460c4c2fec",
         "proposer":"0x7631958d57cf6a5605635a5f06aa2ae2e000820e",
         "state_hash":"0x10931619d1986b4b62f816c11643dbe66aeccbb48e2995b81fbf0786ceb312d1",
         "transactions_hash":"0x0cabb62272efeac14a06eb323c5b7e8b87271a948a619e5ead4a4fd284c094cf",
         "num_txs":7,
         "txs":[...]
      },
      {  
         "epoch":"17478",
         "status":4,
         "height":17452,
         "timestamp":"1550199520",
         "hash":"0x2ff868bf9c8aab3c2482a91b090530f430c8afb94fd66c60b9c8fd845899a00a",
         "parent_hash":"0x082b3653ccc74b26612da4a7666b2c3e9c2ce2222dd90c6083884892a0e3f1c6",
         "proposer":"0x9f1233798e905e173560071255140b4a8abd3ec6",
         "state_hash":"0x4d78020673af830a92ff5fc78a9d1859ecee3b07bf7cbda8d3ae74d61e0fee50",
         "transactions_hash":"0x1d77c10d77a8380f07ade4474816332d347f8739913aee03ae81f1f02391d3ae",
         "num_txs":3,
         "txs":[...]
      },
      {  
         "epoch":"17479",
         "status":4,
         "height":17453,
         "timestamp":"1550199526",
         "hash":"0x7953f10d559405dad20db498947148a73781546209485a803e414574e3439255",
         "parent_hash":"0x2ff868bf9c8aab3c2482a91b090530f430c8afb94fd66c60b9c8fd845899a00a",
         "proposer":"0x2e833968e5bb786ae419c4d13189fb081cc43bab",
         "state_hash":"0x62e34301225525c3dd44ee951e45a97a1590303aa9ba3586cf0c1791b1f8ebc4",
         "transactions_hash":"0x404e4a202f4e621ccf0abe824c318edf012b5a52b5c52d3509e050b996185f53",
         "num_txs":6,
         "txs":[...]
      },
      {  
         "epoch":"17480",
         "status":4,
         "height":17454,
         "timestamp":"1550199532",
         "hash":"0xe752c9e9dd0b5bca6aefe31c5d84845ba7e3d469eb56f1a91300b316ffc5ce4c",
         "parent_hash":"0x7953f10d559405dad20db498947148a73781546209485a803e414574e3439255",
         "proposer":"0xdfb095b990c98a96dd434fe45cd040ec2167c228",
         "state_hash":"0x2a2b68e13f0bb27b3adbef5ab54d1a8ef07a6e16afa8172684c5f5e8771f43ba",
         "transactions_hash":"0x679095a23b223847c197005d0b6e1995012bb381f49fc3c36bda40af6143149d",
         "num_txs":5,
         "txs":[...]
      },
      {  
         "epoch":"17481",
         "status":4,
         "height":17455,
         "timestamp":"1550199539",
         "hash":"0x05b6b8bd715f600242208710081395a050e37d6af0fa9789f74b50d37c696ca6",
         "parent_hash":"0xe752c9e9dd0b5bca6aefe31c5d84845ba7e3d469eb56f1a91300b316ffc5ce4c",
         "proposer":"0x2e833968e5bb786ae419c4d13189fb081cc43bab",
         "state_hash":"0xa6ad424d8d3d02c52f8f4aefa8c7d92a746e9b1368bb723e56805827d4b757f4",
         "transactions_hash":"0x016e5c9a7e43cb5d869d3a65a03da6e87e91fe5da3bb2bc9319b262532cfab42",
         "num_txs":5,
         "txs":[...]
      },
      {  
         "epoch":"17482",
         "status":4,
         "height":17456,
         "timestamp":"1550199545",
         "hash":"0x16b6d178380af8fb580f6d055919744f8dbee0c850d685f7f9dc34507db8f716",
         "parent_hash":"0x05b6b8bd715f600242208710081395a050e37d6af0fa9789f74b50d37c696ca6",
         "proposer":"0xc15e24083152dd76ae6fc2aeb5269ff23d70330b",
         "state_hash":"0xd97a3238cd3f97c2e3db9f4c825a6bb59ba2bb02112029c83f53b9495ef282ac",
         "transactions_hash":"0xbbd09b8bd634d59b44f810a72c2adb836eef3c4f83ef01033281c556bbe35342",
         "num_txs":3,
         "txs":[...]
      },
      {  
         "epoch":"17483",
         "status":4,
         "height":17457,
         "timestamp":"1550199551",
         "hash":"0x9b9cd1306346a692258f9b2c1ee2a0cdb66956efbf41e9c43658cf078fc2c229",
         "parent_hash":"0x16b6d178380af8fb580f6d055919744f8dbee0c850d685f7f9dc34507db8f716",
         "proposer":"0x9f1233798e905e173560071255140b4a8abd3ec6",
         "state_hash":"0xbb018c8e3b6c7d94bc8d1e547fe748296df5ef8f5734a9abfd5faaa54d11c858",
         "transactions_hash":"0x06d08fc4e13b021868f1394af440d53f4eca60e55015eb3dea7e8fcdf5d595ea",
         "num_txs":4,
         "txs":[...]
      },
      {  
         "epoch":"17484",
         "status":4,
         "height":17458,
         "timestamp":"1550199557",
         "hash":"0x70e1102013273079484dff737c36850765eb9794e2fde402fa3c4c2ddb45fc7b",
         "parent_hash":"0x9b9cd1306346a692258f9b2c1ee2a0cdb66956efbf41e9c43658cf078fc2c229",
         "proposer":"0x7631958d57cf6a5605635a5f06aa2ae2e000820e",
         "state_hash":"0xd3915c55728a568c6272de77dbea60aa20a1c1fb6c096a7fd4eecdb0bdde005d",
         "transactions_hash":"0xe51b8bea2fa6e9ff2c28bf488913c66d081647dbcf0c85311099b84fcc3769be",
         "num_txs":4,
         "txs":[...]
      }
   ],
   "totalPageNumber":1746,
   "currentPageNumber":"1"
}
```

## Transaction APIs

### GetTransaction

This API returns the details of the transaction being queried with hash.

**REST Uri**: /transaction/:hash

**Query Parameters**

- hash: the transaction hash

**Returns**

- block_height: height of the block that contains the transaction
- hash: the hash of the transaction itself
- data: the details of the transaction
- type: transaction type
- totalTxsNumber: total number of transactions in database
- timestamp: the time stamp of the block contains this block
- number: the sequence number of the transaction in database

**Example**
```
{  
   "type":"transaction",
   "body":{  
      "hash":"0XF16402022FFFADA96C4BA9A78F79730903F8D99EF44D221FC5869EC4191260EC",
      "type":5,
      "data":{  
         "fee":{  
            "thetawei":"0",
            "tfuelwei":"1000000000000"
         },
         "source":{  
            "address":"0x02990c3f7f75865bcd2fb28450f01065754f9372",
            "coins":{  
               "thetawei":"0",
               "tfuelwei":"1150000000000000"
            },
            "sequence":"0",
            "signature":"0x66cb200ad7def6a0b4e9d377fd6a54cf19f952d089772b2dda8bd0f0927434825acec09e5c2c7aaaf9c4d18a2730786ee619a593fd49395913785aa4255e164001"
         },
         "target":{  
            "address":"0x49e2268b8962a7b5680512173f2b320418003082",
            "coins":{  
               "thetawei":"0",
               "tfuelwei":"0"
            },
            "sequence":"126",
            "signature":"0xdd6aecdf642a001b9ae299cf44aa5c142dac45dd58666d326870dc53670dc204548951880ebce343afb27c968bb99488c23bc9af43a60c4de6299c6242cf07ac00"
         },
         "payment_sequence":"1550282279177",
         "reserve_sequence":"178",
         "resource_id":"vidivz187ttu9eck65d"
      },
      "number":196771,
      "block_height":"30615",
      "timestamp":"1550282330"
   },
   "totalTxsNumber":196771
}
```

### GetTransactionsByRange

This API returns a list of transactions of given the page number and limit number. 

**REST Uri**: /trancastions/range

**Query Parameters**

- pageNumber: the page number, 0 stands for the latest
- limit: the limit size of each page

**Returns**

- currentPageNumber: the number of current page
- totalPageNumber: the total number of pages
- For each transaction it is similar to the returns of the GetTransaction API. Please [see above](#gettransaction).

**Example**
```
// Request
curl https://explorer-api.thetatoken.org/api/transactions/range?pageNumber=1&limit=10

// Result
{  
   "type":"transaction_list",
   "body":[  
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...}
   ],
   "totalPageNumber":20354,
   "currentPageNumber":"1"
}
```

### GetTransactionsByBlockRange

This API returns a list of block of given the page number and limit number. 

**REST Uri**: /trancastions/blockRange

**Query Parameters**

- blockStart: the lowest block height wants to query
- blockEnd: the highest block height wants to query

**Returns**

- For each transaction it is similar to the returns of the GetTransaction API. Please [see above](#gettransaction).

**Example**
```
// Request
curl https://explorer-api.thetatoken.org/api/transactions/blockRange?blockStart=1&blockEnd=10

// Result
{  
   "type":"transaction_list",
   "body":[  
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...},
      {...}
   ]
}
```

## Account APIs

### GetAccount

This API returns the details of the account being queried with address.

**REST Uri**: /account/:address

**Query Parameters**

- address: the address of the account

**Returns**

- address: the account address
- balance: the native token balance
- reserved_funds: fund reserved for micropayment through the off-chain resource-oriented payment pool
- sequence: the current sequence number of the account
- txs_counter: the counter map contains how many transactions of each transaction type include this account

**Example**
```
// Request
curl https://explorer-api.thetatoken.org/api/account/0x3c6D5ED0353c22c31c5F91688A9D10E7Af2DF636

// Result
{
  "type": "account",
  "body": {
    "address": "0x3c6d5ed0353c22c31c5f91688a9d10e7af2df636",
    "balance": {
      "thetawei": "0",
      "tfuelwei": "1540957523000000000000"
    },
    "sequence": "0",
    "reserved_funds": [],
    "txs_counter": {
      "2": 2,
      "5": 973
    }
  }
}
```
### GetAccountTxHistory

This API returns the details of the account being queried with address.

**REST Uri**: /accountTx/:address

**Query Parameters**

- address: the address of the account
- type: type of the transaction (see the **Transaction Types** note above)
- isEqualType: `true` returns a transaction list only include the type above, `false` returns a transaction list exclude the type above.
- pageNumber: the number of page
- limitNumber: the size of each page

**Returns**

- currentPageNumber: the number of current page
- totalPageNumber: the total number of pages
- For each transaction it is similar to the returns of the GetTransaction API. Please [see above](#gettransaction).

**Example**
```
// Request
curl "https://explorer-api.thetatoken.org/api/accounttx/0x3c6D5ED0353c22c31c5F91688A9D10E7Af2DF636?type=2&pageNumber=1&limitNumber=50&isEqualType=true"

// Result
{
  "type": "account_tx_list",
  "body": [
    {...},
    {...}
  ],
  "totalPageNumber": 1,
  "currentPageNumber": 1
}
```
### GetTopTokenHolders
This API returns the list of top token holders.

**REST Uri**: /account/top/:tokenType/:limit

**Query Parameters**

- tokenType: type of the token(theta/tfuel)
- limit: the size of returns

**Returns**

- For each account it is similar to the returns of the GetAccount API. Please [see above](#getaccount).

**Example**
```
// Request
curl "https://explorer-api.thetatoken.org/api/account/top/theta/5"

// Result
{
"type": "account_list",
"body": [
   {...},
   {...},
   {...},
   {...},
   {...}
   ]
}
```
## Stake APIs

### GetAllStakes

This API returns all stake records.

**REST Uri**: /stake/all

**Returns**
- stakes: json representation of the stakes
   - _id: the ID for the stake record
   - type: this stake is in the validator candidate pool or the guardian candidate pool
   - holder: the holder account's address
   - source: the source account's address
   - amount: the staked thetawei amount 
   - withdrawn: `true` returns the stake is withdrawn, `false` returns the stake is not withdrawn
   - return_height: the expected height the tokens return to his staking wallet if a node withdraws its stake

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/stake/all

// Result
{
   "type": "stake",
   "body": [{
      "_id": "5eb9f45d38696f556cc3334d",
      "type": "vcp",
      "holder": "0x80eab22e27d4b94511f5906484369b868d6552d2",
      "source": "0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8",
      "amount": "20000000000000000000000000",
      "withdrawn": false,
      "return_height": "18446744073709551615"
      },{
         "_id": "5eb9f45d38696f556cc3334e",
         "type": "vcp",
         "holder": "0x80eab22e27d4b94511f5906484369b868d6552d2",
         "source": "0x747f15cac97b973290e106ef32d1b6fe65fef5a1",
         "amount": "40000000000000000000000000",
         "withdrawn": false,
         "return_height": "18446744073709551615"
      },{
         "_id": "5eb9f45d38696f556cc33351",
         "type": "vcp",
         "holder": "0xa61abd72cdc50d17a3cbdceb57d3d5e4d8839bce",
         "source": "0x0c9a45926a44a6fc9c8b6f9cb45c20483038698c",
         "amount": "32000000000000000000000000",
         "withdrawn": false,
         "return_height": "18446744073709551615"
      }
      ...
   ]
}
```

### GetTotalStakedAmount

This API returns the total amount of stakes.

**REST Uri**: /stake/totalAmount

**Returns**

- totalAmount: the total amount of staked thetawei
- totalNodes: the total amount of stake nodes

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/stake/totalAmount

// Result
{
   "totalAmount": "317702156000000000000000000",
   "totalNodes": 12
}
```

### GetStakeByAddress

This API returns the stakes being queried with address.

**REST Uri**: /stake/:address

**Returns**

- For each stake it is similar to the returns of the GetAllStakes API. Please [see above](#GetAllStakes).

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/stake/totalAmount

// Result
{
   "type": "stake",
   "body": {
   "holderRecords": [],
   "sourceRecords": [
      {
         "_id": "5eb9f60638696f556cc33aa3",
         "type": "vcp",
         "holder": "0xe2408dff7a1f9bc247c803e43efa2f0a37b10ba6",
         "source": "0xc15149236229bd13f0aec783a9cc8e8059fb28da",
         "amount": "30000000000000000000000000",
         "withdrawn": false,
         "return_height": "18446744073709551615"
      },
      {
         "_id": "5eb9f60638696f556cc33aa5",
         "type": "vcp",
         "holder": "0x15cc4c3f21417c392119054c8fe5895146e1a493",
         "source": "0xc15149236229bd13f0aec783a9cc8e8059fb28da",
         "amount": "30000000000000000000000000",
         "withdrawn": false,
         "return_height": "18446744073709551615"
      },
      {
         "_id": "5eb9f60638696f556cc33aa4",
         "type": "vcp",
         "holder": "0xa144e6a98b967e585b214bfa7f6692af81987e5b",
         "source": "0xc15149236229bd13f0aec783a9cc8e8059fb28da",
         "amount": "30000000000000000000000000",
         "withdrawn": false,
         "return_height": "18446744073709551615"
      }
   ]
   }
}
```

## Supply APIs

### GetThetaAmount

This API returns the total amount and circulation amount of Theta.

**REST Uri**: /supply/theta

**Returns**

- total_supply: the total amount of theta supplied
- circulation_supply: the circulation amount of theta supplied

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/supply/theta

// Result
{
   "total_supply":1000000000,
   "circulation_supply":1000000000
}
```

### GetTFuelAmount

This API returns the circulation amount of TFuel.

**REST Uri**: /supply/tfuel

**Returns**

- circulation_supply: the circulation amount of tfuel supplied

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/supply/tfuel

// Result
{
   "circulation_supply":5000000000
}
```

## Token APIs

### GetTokenSummary

This API returns the summary info of one token.

**REST Uri**: /tokenSummary/:address

**Query Parameters**

- address: the token's smart contract address

**Returns**

- contract_address: the contract address of the token
- holders: the total number of the token holders
- max_total_supply: the total supply of the token
- name: the name of the token
- total_transfers: the total transactions number of the token
- type: the type of the token(TNT-20/TNT-721)

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/tokenSummary/0x5d0004fe2e0ec6d002678c7fa01026cabde9e793

// Result
{
   "type": "token_info",
   "body": {
      contract_address: "0x5d0004fe2e0ec6d002678c7fa01026cabde9e793",
      holders: 837,
      max_total_supply: "2903",
      name: "TPMC Egg",
      total_transfers: 3207,
      type: "TNT-721"
   }
}
```

### GetTokenTransactions

This API returns a list of token transactions of given the token address, page number and limit number. 

**REST Uri**: /token/:address

**Query Parameters**

- address: the token's smart contract address
- pageNumber: the page number, 0 stands for the latest
- limit: the limit size of each page
- token_id: the token id(optional, only applied for TNT-721 tokens)

**Returns**

- currentPageNumber: the number of current page
- totalPageNumber: the total number of pages
- tokenTransaction: json representation of the token transaction
   - contract_address: the contract address of the token
   - from: the sender's account address of the transaction
   - hash: the hash of the transaction
   - name: the name of the token
   - timestamp: the timestamp of the transaction
   - to: the receiver's account address of the transaction
   - token_id: the token id
   - type: the type of the token(TNT-20/TNT-721)
   - value: the number of tokens included in the transaction

**Example**
```
// Request 
curl https://explorer-api.thetatoken.org/api/token/0x5d0004fe2e0ec6d002678c7fa01026cabde9e793?pageNumber=1&limit=20

// Result
{
   "type": "token_info",
   currentPageNumber: 1
   totalPageNumber: 161,
   "body": [{
      contract_address: "0x5d0004fe2e0ec6d002678c7fa01026cabde9e793",
      from: "0x70dea7940584a2f62476e2dc0b9a017e7287a945",
      hash: "0xd28ac9d57b01d9f8c7586a9efd13bcbfc68775a789b2222dbc16fb6a5983b346",
      name: null,
      timestamp: "1660853966",
      to: "0x501077f68d8261495f8f179f75d52a9c0f39ae94",
      token_id: "1001",
      type: "TNT-721",
      value: 1,
   },{
      contract_address: "0x5d0004fe2e0ec6d002678c7fa01026cabde9e793"
      from: "0x4e97bf49b538a9469d6ad0576f46543fd4b16c2e"
      hash: "0xf5671192e6d5b7f67538af90a59571f4ac3f47ff557fc279575a2920049df5e6"
      name: null
      timestamp: "1660820162"
      to: "0x20ae1265e06163d1bd197824170d62a458ebf273"
      token_id: "531"
      type: "TNT-721"
      value: 1
   }, ...]
}
```