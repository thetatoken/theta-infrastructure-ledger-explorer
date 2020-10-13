var https = require('https');
var MemoryStream = require('memorystream');
var keccak256 = require('js-sha3').keccak256;
var fs = require('fs')


function getVersionList() {
  return new Promise((resolve, reject) => {
    console.log('Retrieving available version list...');

    var mem = new MemoryStream(null, { readable: false });
    https.get('https://solc-bin.ethereum.org/bin/list.json', function (response) {
      if (response.statusCode !== 200) {
        reject('Error downloading list: ' + response.statusCode)
        return;
      }
      response.pipe(mem);
      response.on('end', function () {
        resolve(JSON.parse(mem.toString()))
      });
    });
  })
}
function downloadBinary(outputName, version, expectedHash) {
  return new Promise((resolve, reject) => {
    console.log('Downloading version', version);
    var isDone = false;
    const prefix = outputName.slice(0, outputName.lastIndexOf('/'))
    console.log(prefix)
    // Remove if existing
    if (!fs.existsSync(prefix)) {
      fs.mkdirSync(prefix)
    }
    if (fs.existsSync(outputName)) {
      console.log(`file ${outputName} exists, return.`)
      resolve({result: 'Done', fileName: outputName});
      return;
    }
    process.on('SIGINT', function () {
      if (!isDone) {
        console.log('\nInterrupted before download, removing file.');
        fs.unlinkSync(outputName);
      } else {
        console.log('\nInterrupted after download, doing nothing and exit.');
      }
      process.exit(1);
    });

    var file = fs.createWriteStream(outputName, { encoding: 'binary' });
    https.get('https://solc-bin.ethereum.org/bin/' + version, function (response) {
      if (response.statusCode !== 200) {
        // console.log('Error downloading file: ' + response.statusCode);
        // process.exit(1);
        reject('Error downloading file: ' + response.statusCode);
        return;
      }
      response.pipe(file);
      file.on('finish', function () {
        file.close(function () {
          var hash = '0x' + keccak256(fs.readFileSync(outputName, { encoding: 'binary' }));
          if (expectedHash !== hash) {
            // console.log('Hash mismatch: ' + expectedHash + ' vs ' + hash);
            // process.exit(1);
            reject('Hash mismatch: ' + expectedHash + ' vs ' + hash);
            return;
          }
          isDone = true;
          resolve({result: 'Done', fileName: outputName});
        });
      });
    });
  })

}
function cb(list) {
  list = JSON.parse(list);
  // var wanted = pkg.version.match(/^(\d+\.\d+\.\d+)$/)[1];
  // console.log('check versions')
  // for(let version in list.releases){
  //   console.log('version:', version)
  // }
  // console.log('End of check versions')
  var wanted = '0.7.3';
  var releaseFileName = list.releases[wanted];
  var expectedFile = list.builds.filter(function (entry) { return entry.path === releaseFileName; })[0];
  if (!expectedFile) {
    console.log('Version list is invalid or corrupted?');
    process.exit(1);
  }
  var expectedHash = expectedFile.keccak256;
  downloadBinary(`../libs/${releaseFileName}`, releaseFileName, expectedHash);
  // for(let version in list.releases){
  //   var releaseFileName = list.releases[version];
  //   var expectedFile = list.builds.filter(function (entry) { return entry.path === releaseFileName; })[0];
  //   if (!expectedFile) {
  //     console.log('Version list is invalid or corrupted?');
  //     process.exit(1);
  //   }
  //   var expectedHash = expectedFile.keccak256;
  //   downloadBinary(`./libs/${releaseFileName}`, releaseFileName, expectedHash);
  // }
}
exports.downloadAll = function (prefix) {
  getVersionList().then(async list => {
    for (let version in list.releases) {
      var releaseFileName = list.releases[version];
      var expectedFile = list.builds.filter(function (entry) { return entry.path === releaseFileName; })[0];
      if (!expectedFile) {
        console.log('Version list is invalid or corrupted?');
        return;
      }
      var expectedHash = expectedFile.keccak256;
      await downloadBinary(`${prefix}/${releaseFileName}`, releaseFileName, expectedHash);
    }
  })
}

exports.downloadByVersion = function (version, prefix) {
  return new Promise(async (resolve, reject) => {
    try {
      let list = await getVersionList();
      var releaseFileName = list.releases[version];

      var expectedFile = list.builds.filter(function (entry) { return entry.path === releaseFileName; })[0];
      if (!expectedFile) {
        reject('Version list is invalid or corrupted?');
        return;
      }
      var expectedHash = expectedFile.keccak256;
      const result = await downloadBinary(`${prefix}/${releaseFileName}`, releaseFileName, expectedHash);
      console.log('result in downloadByVersion:', result)
      resolve(result)
    } catch (e) {
      console.log('Error in downloadByVersion catch :', e)
      reject(e)
    }
  })

  // getVersionList(function (list) {
  //   list = JSON.parse(list);
  //   var releaseFileName = list.releases[version];
  //   var expectedFile = list.builds.filter(function (entry) { return entry.path === releaseFileName; })[0];
  //   if (!expectedFile) {
  //     console.log('Version list is invalid or corrupted?');
  //     process.exit(1);
  //   }
  //   var expectedHash = expectedFile.keccak256;
  //   downloadBinary(`./libs/${releaseFileName}`, releaseFileName, expectedHash);
  // })
}