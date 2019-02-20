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
	- [Account APIs](#account-apis)
		- [GetAccount](#getaccount)
   - [Supply APIs](#supply-apis)
		- [GetThetaAmount](#getthetaamount)
      - [GetTFuelAmount](#gettfuelamount)

## Theta Explorer APIs

## Block APIs

### GetBlock

This API returns the details of the block being queried with height.

**REST Uri**: /block/{height}

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
curl https://explorer.thetatoken.org:9000/api/block/1

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

- pageNumber: the page number, 0 stands for the latest
- limit: the limit size of each page

**Returns**

- currentPageNumber: the number of current page
- For each block it is similar to the returns of the GetBlock API. Please [see above](#getblock).

**Example**

In this example, we query the blocks with page number 0 and page size 10.

```
// Request
curl https://explorer.thetatoken.org:9000/api/blocks/top_blocks?pageNumber=0&limit=10

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
   "currentPageNumber":"0"
}
```

## Transaction APIs

### GetTransaction

This API returns the details of the transaction being queried with hash.

**REST Uri**: /transaction/{hash}

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

This API returns a list of block of given the page number and limit number. 

**REST Uri**: /trancastions/range

**Query Parameters**

- pageNumber: the page number, 0 stands for the latest
- limit: the limit size of each page

**Returns**

- currentPageNumber: the number of current page
- totalPageNumber: the total number of 
- For each block it is similar to the returns of the GetTransaction API. Please [see above](#gettransaction).

**Example**
```
// Request
curl https://explorer.thetatoken.org:9000/api/transactions/range?pageNumber=0&limit=10

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
   "currentPageNumber":"0"
}
```

## Account APIs

### GetAccount

This API returns the details of the account being queried with address.

**REST Uri**: /account/{address}

**Query Parameters**

- address: the address of the account

**Returns**

- address: the account address
- balance: the native token balance
- reserved_funds: fund reserved for micropayment through the off-chain resource-oriented payment pool
- sequence: the current sequence number of the account
- txs_hash_list: the history list of most recent at most 100 transactions

**Example**
```
// Request
curl https://explorer.thetatoken.org:9000/api/account/0X3A77BAE927B9B6A5AF0A23409937F222DB543135

// Result
{  
   "type":"account",
   "body":{  
      "address":"0X3A77BAE927B9B6A5AF0A23409937F222DB543135",
      "balance":{  
         "thetawei":"0",
         "tfuelwei":"250573000000000000"
      },
      "sequence":"127",
      "reserved_funds":[],
      "txs_hash_list":[  
         "0X1AD01665F5AEACE4BB38D9EE4F47069230EED84B530E6CFE953C83271CCBC0CD",
         "0X4D72DB6C9E91EAEE7FE5F4852D31D3C533FA280051E4B55EB1B84B93A61E1C94",
         "0X40D38B1551B47193D698F63C9DC09CE8C10C04B2DFB72712D095B6ACC9873D23",
         "0X39D0F96DA8E1B4FC5C54A6C000DB4E9E22CA48F67955549EAC703F3414E0D2CC",
         "0X2BEAD5F9F54BEBBECCC3DB3A5E9E7E0A20CC9AB817E98769B96BF200D8D0D25F",
         "0X03EA1A85CA40D3602E036A5795FD3DDAD554FECA00B3367AE8E76B90605B53CB",
         "0XFB339C704CB881BF2191C3BD49431BC4BF01BA840A5BF5164583D322F6672056",
         "0X1D945DEBF0051B16E863F1344A702B410F6D5F5B940DC9248909FCA04CD41209",
         "0X95736A7BD32672179B8CADC062FEC5C696674CD76F7D102B4A84AFDD6A2A3D10",
         "0X29F29FB2D0D4FB37278D2CB8C5049233F39CD97058110AB15E9F0AEC743A0E9B",
         "0XFC30668BC1F3749FD436A75217223B9016C2B754411BF9EA7752ED5299EC3ACE",
         "0X3E62818E8187759B62306080A3589B2876329C871D1B5292EEB73FB1537C2997",
         "0X5DCE1BE732A281D4035B1BEA956B2229219AB9C1F2EBA3052BDDC12F426BBB3E",
         "0XA73F6B3ED6DE6F71EDB5730CC99CEDE0B332892613E8B2EF0F4DD1945A295A6B",
         "0X42D290253ACAD9B7EAF9B97C781258841F9EB87A5DB967F5B58ACF57E51B2A5E",
         "0XEBB5B3AC6A09FF4F300F302A89EC83E1456266E667467DBF4432FCBA6D2A2C4E",
         "0X637BD9B7B87C9E92DAF34C5109D353C5DB490FC1FBCDB453637EDE9C1D998979",
         "0X87E37501D613529B9F54995EEA978E01BEF0A81A8D0029E93225E8BA856A1D95",
         "0X957D69515BBE3C89A553985BB5E295FCCB800DBEC740EB9112FC0F8EFB60F2FF",
         "0XA8AFE97F48E3DC7810243EAFFF761B729DCD1C1D0EAE74D1E9E70B8FD362A3B9",
         "0XA5C1858488E58E7B8AE63580663C189C40CBD6156BA2C91077D2EDDBCAC6EF69",
         "0XA8FB984A83870835D0B333B4CC5D7E5E7F8005EBBEF5DA58063254326A79EA8B",
         "0XB15BB18E9BBABB13027C0661CC832606E7D96FE1EBE051CC94CB303F7874BA5E",
         "0XDEBE026A1BF5C950AF8D17805B31B8588E06A39D8356E3D28A023E10B7F77B39",
         "0X78918343C715901419ABF74553BEFE463893B47F4E82A0EEADEAB620CB954813",
         "0X6A714A72CAD32C37A1069CC700BA7D2CB9CA81A4D7792AB52F6BCF3908B6781F",
         "0X70089D5219FEB158DE48B83E061D90DF58D9513A762FC4B0D376C64B11E1371E",
         "0X5CCB0B9E911BA31777855A58EC497DC93D378F4D759FE4D69B0D8E8F30683E41",
         "0X7776996A106A0F705D4076BAC42CECF4B3CF0B9FD23A78C6A48621744112BB90",
         "0X1DC161A64F6D074F6130DE56A02190A19DBA2620716DF8BA7DEAF7547501614C",
         "0X4A1173F91A01952936A021047C73DE8ED7691BDFFC5B8AA1BCB4D1F0630547E8",
         "0X5012C651BD30CE9F017ABF2E129CD437BF7CCDD022B45DD18E77CD3DC7E7ED44",
         "0X484A800E58464F153322F7B55336EE7B4D6E22DC46153DE043052AE8D73B3518",
         "0X05FB9022C0879CAB2BA28F57D419E2B1DF9B94A6D0BB1B1BBB30746B9008F4DA",
         "0XFCD910C39A6F25C01B14BD9C3AFAACE215580F1C80234CEFB7928C07BC61BEAC",
         "0X4B56290FB493465B91FB744CD408618F34E797BEF9C1B9DD5C43E7BABF63DF09",
         "0X7B00B4B4C007F22173C7C197A311DA030DCE066AE24D9F1CF3B54E7B2F1A86AA",
         "0X1E1EB721A98F0CB936193EB40D01301E7CADD8E4977E8090DFE5587698F39C17",
         "0X5BEB80675C6666FCBAC607339C0529E9D07743A821F727B674135199F614CD4B",
         "0XF393A1AA2BBDA5B41FFCD47D2C23E8B0B292DE3077DB1B9CDE59B01F0CC8037B",
         "0X88D082ABEF022626EB1F142F4C256167C265920A5762C07B713253410714043E",
         "0X90217740EB2EAC137D6F05097E40509DB44AA1487791593F9194233E69C0E618",
         "0XDBAF289774ACB0B1DE49BCF6AB2C265D8685054B31720A3F2DD8DB6031BF36A3",
         "0X6AAF62B2A11C5B617A8DE81117A6BEFD2888504C4EB1C90CE2B4C645DC640B6F",
         "0X27BE10D40C9C797C4E939E5E9C130B58CCE784F37C721F750B0CDDAC4AC53290",
         "0X2029EEE679D9EA221D59ACC6FE71120B60278038621F9A5B9F0B6776A4639C74",
         "0X834B5EC0C4A36E1995B67DEC694E0CA65E6100684EDFDADD99199293E5FE91EC",
         "0X21822D68D1E46D9CEDB2CC09A530B035D191613FCE0C68D06B6BDBBDFAF34B8B",
         "0X4DFC59CC4D168E7B56F803FEB54AAF34405261B2A9A61ED55752126BE7D0D7B0",
         "0X46A52AE354CFCF17F59C9566887FF92724DD0D1DFBFA578C49C5D8830B2D826E",
         "0X20C5132F6BCBBB501BFF66886E8CB0DB6FFFA26790FA8058F1FC2E3F78B60ED1",
         "0XC40D1931EA7C3F09CBE1832F7A15A5051B312DE24A4B0255A829C86D32B7CD9F",
         "0XF2A1A043019E4F3CF37F9401884EB859C961B208BDCB6A67DF72B90B0B2D3737",
         "0X9CEA49D0E5947C84CF9DD4EEC0B343C682C0DC5B73289445737424BC16F0EB25",
         "0XAFD1F096B4EE32599741EF55CFCEDCCF2F0270A6C2D67810440D40EB55ECD886",
         "0XBBD6CA1329736E6B217460C03C459A2A17695BF98358A4CDCFD0D6FB207C8716",
         "0XB37588EBCDA801CC9B6F55AA19310F117331DB0A8B234D551E8F48F538DAD955",
         "0X843EA75068982A2455B5FEE7B56574E60D35A649C70A563D6A6123EC8232FCC1",
         "0X3CF57E106B1F45E4D26B1C6D19992C14375A864423F9AB5D6E4989BEB22052F7",
         "0X173E25D85544B24FDD09D79A6104BDE4D27AA97802D0A8DBDD447671D18A57FC",
         "0X8A0B5D8651946BF369A2468A62553F418F700F9372020F3EB5013678C9052D36",
         "0XBC896E2C09F7E6947F23A25A46E6591FE52939BBCBE2D8608D47200F348E4B1A",
         "0X379627E0221E9834B4AE578BBA057A30822E0D79DEA7648E11D34E3691C3BEE1",
         "0X5D0B461886C01479FF9CBA5F6318D40B4EEF6AC56D0574AB89C39D3E624F8421",
         "0XD4177F109ACF350DD99C196B9AFA388C1C1313AA74E1BDE20ADE7D9E2BD0B64D",
         "0X17EBB352ABADB13A699B583CA65B51472DDD3BB5C51FE43D361FE46B3C97A3BD",
         "0XC29B9835568D6DDBE5D9D643CF09CD4C7224EB85AEE33876B2F52C8BE24C74F2",
         "0X48C0B00197427AB50318C5E2A56F2B157625C367753BAA93C7BB3C10D8E391F3",
         "0X1A55449FBC3CDA8FFA04CD9D6B0A4A4A35FA751E49F94B62A2D5250568C3CA55",
         "0XB7136CA7233D412F609B22C362AFD8EE3B6105209AD77E28EFE6829E61933733",
         "0X6DC09F3C69DC260CBD78A845E9FEC7AF4BBA6D3AEC5F1FC28BE34DC0CB902735",
         "0X618AAD88E49D55EECF3EDE4A75E9012F5AF8C2EBAE69FEFAFD34BF0953009769",
         "0X976D82041D47AE8CC1938C10C8EE02CB574980E5E5DB8F46D977E40602CB730E",
         "0X7BB0AF0A8A8EE81E59F92F43334AF24FFBAA7B4F879346505AEEBE1E18466803",
         "0X148CC4DC9639CA752E0DE7A05FC8B64D76452163A4493B4C7E8FE8FDC32F5539",
         "0XCDDAFA7CA48BA34B556DE7F944D0B6393DC71FA6EDE77DD66FEFEB7C89199DF5",
         "0X41AF633C44F9B08A2F7740081CD99170FB5F856714274C533F640066DF2EDAF2",
         "0XEC83934249330CECFDCF7A97730A5CD4B897BA42F67A12651840DF6143CCA566",
         "0XB68B1F48240B241AA8D6C102BC0A06C316726047A5ED4A4DCECD45CA2935184C",
         "0X198787916735A710E75D931B4ED78C0FCC776DBA6AD5A834ADDB778D570413FF",
         "0XFA8EB6E82C8045157EB71D50565A46A266A0B4E958C4AE415DE5FC175CCD2565",
         "0X86238A9B7E4FF3139D5FB9B48D31455E0EF924630E9B30C40E237FC6C0A8B3FB",
         "0X198AA59FD8039AF053CD5A29A28415C4B2984128A1CBDC6759F6D0879AE8A5D0",
         "0XD53F1062389580B06691C3F9B2EC75D0070AAA2E71480EC7A53B98E54CCB1904",
         "0XE9A47D653BBDB8F1A6946F714A6744F8C8E6CFF6F2E65EDC278D7993555EF8EC",
         "0X7A16550FE91BB49D0F659488F4CAF46AE4F08C69A907368BE200DBAEF2CB3F91",
         "0X67543D622D802274D062402BC1A9E0267DFD59D12F3C8EE2CCBA81E9ABA67A6A",
         "0XB6B954F83B461B4DBAD93CD044C65B4E22DFF72E7C79F3ADA8BAD7ACD315BA02",
         "0XF0C1EE13A207725CE9AEE8197E69F5A819D5658EDC33370381B65B2E2C359D3C",
         "0XD1611CC056F0447FFF007249F294AFA1FCBDD7BAF6F99B52E3A348F0959C1231",
         "0X651C6D16DCB2C2088DF384A775BBF99E70671DA34E6D8C6EA7718D2A7B08F2C5",
         "0X4A2CE1EE204668331647EABB82FC88FE346569F35BA3B385C692FEF86EEEA158",
         "0XE4CE9733909E2A7DE6F4FBF753BB75A57B22858B7B33DC85CA882A58D929C108",
         "0X17456AE714796F234FAAEC4089C957D7898E33E585C89549C576E2C446F2F4F1",
         "0XF382295A5D3BB9479FF68569CB3C9119A32F420D07768A3045B1ABAF77327433",
         "0X1312612F805AADF261AFDDB36790E4E4A8DFE744C8776B2A8303C9201E6952C4",
         "0X08B090ED624A76EBEBB465941642050BA94E62D4544F548575F661C97584A92F",
         "0X5656656B5E86AB6B069293E2735446F8573E5A27B610F74CF9F77117B565B5E2",
         "0X2C0C18CCF0E6BC31671B281FC9F0A08B04CAE49A49E6E0EC2C651F59809AB887",
         "0XC42D3F3CDA89E1A86E71E05B2BDBAB7DDE3B000F93E8E874A3B3702B917B6079"
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
{
   "circulation_supply":5000000000
}
```