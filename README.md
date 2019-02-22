# Theta Ledger Explorer
The Theta Ledger Explorer project contains a frontend web application for the Theta explorer, a backend api application to provide data to the frontend, and a blockchain data crawler to download data from the blockchain.

Please click [here to see the Theta Ledger Explorer in action](https://explorer.thetatoken.org/).

## Blockchain Data Crawler
### Setup
The job of blockchain data crawler is to download and convert the blockchain data to a format more friendly for blockchain data exploration. In our current implementation, it uses a NoSQL database Aerospike to store the converted data. Thus we need to install Aerospike first. Below is the instruction to install Aerospike on Ubuntu Linux. For more information on installing aerospike on different systems, please check [here](https://www.aerospike.com/docs/operations/install).
```
wget -O aerospike.tgz 'https://www.aerospike.com/download/server/latest/artifact/ubuntu14'
tar -xvf aerospike.tgz
cd aerospike-server-community-<version>-ubuntu14.04
sudo ./asinstall
```

After installing Aerospike, we can start the blockchain data crawler with the following commands.
```
cd backend/crawler
npm install
node run
```
Now the crawler starts to read the data from blockchain, perform necessary transformation, and stores the converted data in the database. Next we can launch the backend API microservice, and the frontend application microservice following the procedure below.
 
## Backend API Application
### Setup

``` 
cd backend/explorer-api
npm install
node run
```
Now the explorer API application is running at https://localhost:9000

## Frontend Web Application
### Setup
``` 
cd frontend
npm install
```

### Development
``` 
npm run dev
gulp (in a new console window)
``` 

Gulp will tell you where to view the webpage for Live Reloading and automatically open a browser pointing there. (It proxies the original server in order to enable the live reloading) 
It should be https://localhost:3000. Any changes you make to scss or js files should be automatically refreshed in the browser.

To skip Live reloading:
``` 
gulp nosync
```
Then browse to the node server directly at: https://localhost:4000

Other Gulp tasks:
``` 
gulp build-js
gulp build-sass
gulp clean
gulp watch
``` 

## License
The Theta Ledger Explorer reference implementation is licensed under the [MIT License](https://opensource.org/licenses/MIT).
