import React, { useState, useRef, useEffect } from "react";
import get from 'lodash/get';
import map from 'lodash/map';
import merge from 'lodash/merge';
import Web3 from "web3";
import smartContractApi from 'common/services/smart-contract-api';
import Theta from '../../libs/Theta';
import ThetaJS from '../../libs/thetajs.esm'

const web3 = new Web3("http://localhost:3000");
export default function ReadContract(props) {
  const { abi, address } = props;
  console.log(abi);
  return (<div>
    {abi.map((data, i) => {
      return (<FunctionUnit key={i} functionData={data} index={i + 1} address={address} abi={abi}>{JSON.stringify(data)}</FunctionUnit>)
    })}
  </div>)
}

const FunctionUnit = (props) => {
  const { functionData, index, address, abi } = props;
  const [callResult, setCallResult] = useState(null);
  const inputs = get(functionData, 'inputs');
  const outputs = get(functionData, 'outputs');
  const decodedParameters = get(callResult, 'decodedParameters');
  function parseJSON(value) {
    try {
      const json = JSON.parse(value);

      return json;
    } catch (e) {
      return null;
    }
  }
  function initContract(abiStr, address) {
    try {
      const abiJSON = parseJSON(abiStr);

      return new web3.eth.Contract(abiJSON, address);
    } catch (e) {
      console.log('error: ', e)
      return null;
    }
  }
  async function fetchFunction() {
    var contract = new web3.eth.Contract(abi, address);
    // console.log(contract.methods[functionData.name]);
    // contract.methods[functionData.name]().call().then(console.log)
    const senderSequence = 1;
    const functionInputs = get(functionData, ['inputs'], []);
    const functionOutputs = get(functionData, ['outputs'], []);
    const functionSignature = get(functionData, ['signature']).slice(2);

    const inputTypes = map(functionInputs, ({ name, type }) => {
      return type;
    });
    const inputValues = map(functionInputs, ({ name, type }) => {
      if (type.includes('[]')) {
        return parseJSON(inputs[name]);
      }
      else if (type === "boolean" || type === "bool") {
        return Boolean(parseJSON(inputs[name]));
      }

      return inputs[name];
    });
    console.log('inputTypes:', inputTypes)
    console.log('inputValues', inputValues)
    const encodedParameters = web3.eth.abi.encodeParameters(inputTypes, inputValues).slice(2);
    const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
    const gasLimit = 2000000;
    const data = functionSignature + encodedParameters;
    const tx = Theta.unsignedSmartContractTx({
      from: address,
      to: address,
      data: data,
      value: 0,
      transactionFee: gasPrice,
      gasLimit: gasLimit
    }, senderSequence);
    const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
    try {
      console.log('chain id:', Theta.chainId)
      const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
      const callResponseJSON = await callResponse.json();
      const result = get(callResponseJSON, 'result');
      const errorMessage = get(result, 'vm_error');

      setCallResult(merge(result, {
        outputs: functionOutputs,
        decodedParameters: web3.eth.abi.decodeParameters(functionOutputs, get(result, 'vm_return'))
      }));
    }
    catch (e) {
      //Stop loading and put the error message in the vm_error like it came fromm the blockchain.
      setCallResult({ vm_error: e.message })
    }
  }
  useEffect(() => {
    if (inputs.length === 0) fetchFunction();
  }, [])
  return (<div className="read-contract__wrapper">
    <div className="read-contract__title">{`${index}. ${functionData.name}`}</div>
    <div className="read-contract__content">
      {inputs && inputs.length > 0 &&
        <div className="read-contract__inputs">
          {JSON.stringify(inputs)}
        </div>}
      <div className="read-contract__outputs">
        {outputs.map((output, i) =>
          <div className="read-contract__output" key={i}>
            <div className="read-contract__output--content">{decodedParameters ? decodedParameters[i] : null}</div>
            <div className="read-contract__output--unit">{output.type}</div>
          </div>)}
      </div>
    </div>
  </div>)
}