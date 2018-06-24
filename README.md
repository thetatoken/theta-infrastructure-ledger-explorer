# Theta explorer
The Theta explorer project contains a web application for Theta explorer, a backend api application to provide frontend application apis, and a crawler api to read data from block chain server.

Please click [here to see the Theta ledger explorer in action](https://explorer.thetatoken.org/).
## Frontend application
### Setup
``` 
cd frontend
npm install
sudo node server.js
```
Now the frontend application should be available on https://localhost
## Explorer API application
### Setup
``` 
cd backend/explorer-api
npm install
node run
```
Now the explorer API application listens to https://localhost:9000
## Explorer crawler
### Setup
```
cd backend/crawler
npm install
node run
```
Now the crawler reads the data from blockchain, perform necessary transformation, and stores the data in the database. In our current implementation, we use a NoSQL database Aerospike for data storage. Below is the instruction to install Aerospike.
## Aerospike database
### Setup
#### Install on ubuntu
```
wget -O aerospike.tgz 'https://www.aerospike.com/download/server/latest/artifact/ubuntu14'
tar -xvf aerospike.tgz
cd aerospike-server-community-<version>-ubuntu14.04
sudo ./asinstall
```
For more information of install aerospike on different systems, please check [here](https://www.aerospike.com/docs/operations/install).
