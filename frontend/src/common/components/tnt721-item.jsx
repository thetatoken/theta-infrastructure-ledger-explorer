import React from 'react';
// import React, { useState, useEffect } from 'react';
// import { ethers } from "ethers";
// import smartContractApi from 'common/services/smart-contract-api';
// import Theta from 'libs/Theta';
// import ThetaJS from 'libs/thetajs.esm';
// import get from 'lodash/get';
// import map from 'lodash/map';

const Item = props => {
  const { item } = props;
  // const { tokenId, abi, address } = props;
  // const [item, setItem] = useState();
  // useEffect(() => {
  //   if (tokenId === undefined) return;
  //   const arr = abi.filter(obj => obj.name == "tokenURI" && obj.type === 'function');
  //   if (arr.length === 0) return;
  //   const functionData = arr[0];
  //   const inputValues = [tokenId]

  //   async function fetchUrl() {
  //     const iface = new ethers.utils.Interface(abi || []);
  //     const senderSequence = 1;
  //     const functionInputs = get(functionData, ['inputs'], []);
  //     const functionOutputs = get(functionData, ['outputs'], []);
  //     const functionSignature = iface.getSighash(functionData.name)

  //     const inputTypes = map(functionInputs, ({ name, type }) => {
  //       return type;
  //     });
  //     try {
  //       var abiCoder = new ethers.utils.AbiCoder();
  //       var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);;
  //       const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
  //       const gasLimit = 2000000;
  //       const data = functionSignature + encodedParameters;
  //       const tx = Theta.unsignedSmartContractTx({
  //         from: address,
  //         to: address,
  //         data: data,
  //         value: 0,
  //         transactionFee: gasPrice,
  //         gasLimit: gasLimit
  //       }, senderSequence);
  //       const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
  //       const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
  //       const callResponseJSON = await callResponse.json();
  //       const result = get(callResponseJSON, 'result');
  //       let outputValues = get(result, 'vm_return');
  //       const outputTypes = map(functionOutputs, ({ name, type }) => {
  //         return type;
  //       });
  //       outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
  //       let url = abiCoder.decode(outputTypes, outputValues)[0];
  //       if (/^http:\/\/(.*)api.thetadrop.com.*\.json(\?[-a-zA-Z0-9@:%._\\+~#&//=]*){0,1}$/g.test(url) && typeof url === "string") {
  //         url = url.replace("http://", "https://")
  //       }
  //       const isImage = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|svg)/g.test(url);
  //       if (isImage) {
  //         setItem({ image: url });
  //       } else {
  //         fetch(url)
  //           .then(res => res.json())
  //           .then(data => {
  //             setItem(data);
  //           }).catch(e => {
  //             console.log('error occurs in fetch url:', e)
  //             setItem('Error occurs')
  //           })
  //       }
  //     }
  //     catch (e) {
  //       console.log('error occurs:', e);
  //       setItem('Error occurs')
  //     }
  //   }
  //   fetchUrl();
  // }, [tokenId, abi, address])

  return typeof item === 'object' ? (
    <div className="sc-item">
      <div className="sc-item__column">
        <img className="sc-item__image" src={item.image}></img>
      </div>
      <div className="sc-item__column">
        {item.name && item.name.length > 0 &&
          <>
            <div className="sc-item__text">Name</div>
            <div className="sc-item__text name">{item.name}</div>
          </>}
        {item.description && item.description.length > 0 &&
          <>
            <div className="sc-item__text">Description</div>
            <div className="sc-item__text">{item.description}</div>
          </>
        }
      </div>
    </div>
  ) : <div className="sc-item text-danger">{item}</div>
}

export default Item;