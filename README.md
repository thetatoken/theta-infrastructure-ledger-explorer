# Theta explorer
Theta explorer application contains a web application for Theta explorer, a backend api application to provide frontend application apis and a crawler api to read data from block chain server.
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
Now the explorer API application is listening to https://localhost:9000
## Explorer crawler
### Setup
```
cd backend/crawler
npm install
node run
```
Now the crawler is reading the data from blockchain
## Aerospike database
### Setup
#### Install on ubuntu
```
wget -O aerospike.tgz 'https://www.aerospike.com/download/server/latest/artifact/ubuntu14'
tar -xvf aerospike.tgz
cd aerospike-server-community-<version>-ubuntu14.04
sudo ./asinstall
```
Now the aerospike is installed on ubuntun
### Run Aerospike
```
aql
```
For more information of install aerospike on different systems, check https://www.aerospike.com/docs/operations/install