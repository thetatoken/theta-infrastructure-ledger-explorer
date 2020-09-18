# Theta Ledger Explorer
The Theta Ledger Explorer project contains a frontend web application for the Theta explorer, a backend api application to provide data to the frontend, and a blockchain data crawler to download data from the blockchain.

Please click [here to see the Theta Ledger Explorer in action](https://explorer.thetatoken.org/).

## Blockchain Data Crawler
### Setup
The job of blockchain data crawler is to download and convert the blockchain data to a format more friendly for blockchain data exploration. In our current implementation, it uses a NoSQL database MongoDB to store the converted data. Thus we need to install MongoDB first. Below is the instruction to install MongoDB on Ubuntu Linux. For more information on installing MongoDB on different systems, please check [here](https://docs.mongodb.com/manual/administration/install-community/).
```
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

sudo apt-get update

sudo apt-get install -y mongodb-org
```
To start MongoDB, use following command.
```
sudo systemctl start mongod
```
After starting MongoDB, we can setup the config for crawler with the following commands.
```
cd backend/crawler
npm install
mv config_template.cfg config.cfg
```
Now the config.cfg file is created, change `blockchain.start_height` in config file to the snapshot height on the theta node. After setting the config file and start height, we can run crawler using this command.
```
node run.js
```
Now the crawler starts to read the data from blockchain, perform necessary transformation, and stores the converted data in the database. Next we can launch the backend API microservice, and the frontend application microservice following the procedure below.
 
## Backend API Application
### Setup

``` 
cd backend/explorer-api
npm install
mv config_template.cfg config.cfg
node run
```
Now the explorer API application is running at https://localhost:9000

## Frontend Web Application
### Setup
``` 
cd frontend
npm install
mv config_template.js config.js
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
