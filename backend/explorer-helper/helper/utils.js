var { linkBytecode } = require('solc/linker');
var fs = require('fs');
var path = require('path');
const crypto = require('crypto');

exports.normalize = function (hash) {
    const regex = /^0x/i;
    return regex.test(hash) ? hash : '0x' + hash;
}

exports.getBytecodeWithoutMetadata = function (bytecode) {
    // Last 4 chars of bytecode specify byte size of metadata component,
    const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4;
    const metadataStarts = bytecode.slice(bytecode.length - metadataSize, bytecode.length - metadataSize + 14)
    const endPoint = bytecode.indexOf(metadataStarts)
    return bytecode.slice(0, endPoint);
}

exports.getHex = function (str) {
    const buffer = Buffer.from(str, 'base64');
    const bufString = buffer.toString('hex');
    return '0x' + bufString;
}
exports.stampDate = function (sourceCode) {
    let date = new Date();
    const offset = date.getTimezoneOffset()
    date = new Date(date.getTime() - (offset * 60 * 1000))
    return `/**\n *Submitted for verification at thetatoken.org on ${date.toISOString().split('T')[0]}\n */\n` + sourceCode;
}
exports.flatSourceCode = function (sourceCode) {
    const flattenedBytecode = Object.values(sourceCode).map(contract => contract.content).join('\n');
    let flattenedSource = linkBytecode(flattenedBytecode, {});
    flattenedSource = flattenedSource.replace(/import.*;\n/g, "");

    const solidityPragmaRegex = /pragma solidity.*\n/g;

    flattenedSource = flattenedSource.replace(solidityPragmaRegex, (match, offset) => {
        return offset === flattenedSource.search(solidityPragmaRegex) ? match : "";
    });
    return flattenedSource;
}

exports.convertToHashString = function(inputString) {
    const hash = crypto.createHash('sha256').update(inputString).digest('hex');
    return hash.substr(0, 32);
}


function _getImportedContracts(importedFiles, input) {
    let nestedImportedContracts = [];

    for (const importedFile of importedFiles) {
        const importedSource = fs.readFileSync(`node_modules/${importedFile}`, 'utf8');

        const nestedImports = importedSource.match(/import\s+"(.+\.sol)"/g) || [];
        console.log('nestedImports:', nestedImports)
        input.sources[importedFile] = {
            content: importedSource
        };
        if (nestedImports.length > 0) {
            const nestedImportedFiles = [...new Set(nestedImports.map((match) => path.join(path.dirname(importedFile), match.replace(/import\s+"/g, '').replace(/"/g, ''))))];
            console.log('nestedImportedFiles:', nestedImportedFiles)
            nestedImportedContracts.push(..._getImportedContracts(nestedImportedFiles, input));
        }
    }

    return nestedImportedContracts;
}

exports.getImportedContracts = _getImportedContracts;
