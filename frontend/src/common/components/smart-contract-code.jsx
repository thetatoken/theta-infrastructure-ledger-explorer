import React, { useRef } from "react";

import LoadingPanel from 'common/components/loading-panel';
import AceEditor from 'common/components/ace-editor';
import { getHex } from 'common/helpers/utils';
import { smartContractService } from 'common/services/smartContract';

export default class SmartContractCode extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      isCodeEmpty: true,
      isVerifying: false
    }
  }
  setIsVerifying = (val) => {
    console.log('set is verifying')
    this.setState({ isVerifying: val })
  }
  render() {
    const { address, smartContract, isReleasesReady, isLoading, fetchSmartContract } = this.props;
    const { isVerifying } = this.state;
    const showView = _.get(smartContract, 'source_code.length')
    return (
      isLoading ? <LoadingPanel /> :
        showView ? <CodeViewer contract={smartContract} /> : isVerifying ?
          <>
            <div className="code-loading-text">Verifying your source code......</div>
            <LoadingPanel />
          </>
          : <CodeUploader isReleasesReady={isReleasesReady} smartContract={smartContract} address={address}
            setIsVerifying={this.setIsVerifying} fetchSmartContract={fetchSmartContract} />
    )
  }
}

const Options = () => {
  let releases = window.soljsonReleases;
  return (
    <>
      {Object.keys(releases).map(key => {
        let text = releases[key].match(/^soljson-(.*).js$/)[1];
        return (<option value={text} key={key}>{text}</option>)
      })}
    </>
  )
}
const CodeUploader = props => {
  const { isReleasesReady, address, setIsVerifying, fetchSmartContract } = props;
  const sourceCodeRef = useRef(null);
  const versionRef = useRef(null);
  const optimizerRef = useRef(null);
  const abiRef = useRef(null);
  const reset = () => {
    sourceCodeRef.current.value = '';
    abiRef.current.value = '';
  }
  const submit = () => {
    const sourceCode = sourceCodeRef.current.value;
    const abi = abiRef.current.value;
    const version = versionRef.current.value;
    const optimizer = optimizerRef.current.value;
    const byteCode = _.get(props, 'smartContract.bytecode');
    // console.log('Submitting to backend.')
    // console.log(`sourceCode: ${sourceCode}, abi: ${abi}, byteCode: ${byteCode}`)
    // console.log(`optimizer: ${optimizer},  version: ${version}, address: ${address}`)
    setIsVerifying(true);
    smartContractService.verifySourceCode(address, byteCode, sourceCode, abi, version, optimizer)
      .then(res => {
        setIsVerifying(false);
        console.log('res from verify source code:', res);
        let isVerified = _.get(res, 'data.result.verified')
        console.log('result: ', isVerified)
        if (isVerified) {
          fetchSmartContract(address)
        }
      })
  }
  return (
    <>
      <div className="selects-container">
        {isReleasesReady ? <div className="select--container">
          <label>Please select Compiler Version</label>
          <div className="select--selector">
            <select ref={versionRef}>
              <Options />
            </select>
          </div>
        </div> : ''}
        <div className="select--container optimizer">
          <label>
            <span className="select--tooltip">?
              <span className="select--tooltip__text">
                Select the option you used when compiling this contract.
              </span></span>
              Optimization
            </label>
          <div className="select--selector optimizer">
            <select ref={optimizerRef} defaultValue={0}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>
      </div>
      <label htmlFor="txtSourceCode">
        <b>Enter the Solidity Contract Code below &nbsp;</b>
        <span className="text-danger">*</span>
        <span className="text-danger">source code is reqired. Only Single File Supported</span>
      </label>
      <textarea className='code-area' placeholder="Enter your code here." name="txtSourceCode" ref={sourceCodeRef} required />
      <label>Constructor Arguments ABI-encoded (for contracts that were created with constructor parameters)</label>
      <textarea className='abi-area' placeholder="Enter your code here." ref={abiRef} />
      <div className="code-buttons">
        <div onClick={submit}>Verify and Publish</div>
        <div className='reset' onClick={reset}>Reset</div>
      </div>
    </>
  )
}
const CodeViewer = props => {
  const { contract } = props;
  const hasConstructorArguments = _.get(contract, 'constructor_arguments').length > 0;
  const jsonAbi = contract.abi.map(obj => JSON.stringify(obj))
  return (
    <>
      <div className="contract-info">
        <div className="contract-info--block">
          <div className="contract-info--title verified">Contract Source Code Verified</div>
          <div className="contract-info--general">
            <div className="contract-info--raws">
              <div className="contract-info--cell">
                <div>Contract Name:</div>
                <div>{contract.name}</div>
              </div>
              <div className="contract-info--cell">
                <div>Compiler Version:</div>
                <div>{contract.compiler_version}</div>
              </div>
            </div>
            <div className="contract-info--raws">
              <div className="contract-info--cell">
                <div>Optimization Enabled:</div>
                <div><b>{contract.optimizer === 'enabled' ? 'Yes' : 'No'}</b> with <b>200</b> runs</div>
              </div>
              <div className="contract-info--cell">
                <div>Other Settings:</div>
                <div><b>default</b> evmVersion</div>
              </div>
            </div>
          </div>
        </div>
        <div className="contract-info--block">
          <div className="contract-info--title source-code">Contract Source Code (Solidity)</div>
          <AceEditor value={contract.source_code} name="contract_source_code" />
        </div>
        <div className="contract-info--block">
          <div className="contract-info--title abi">Contract ABI</div>
          <AceEditor value={'[' + jsonAbi + ']'} name="contract_abie" height="200px" showGutter={false} />
        </div>
        <div className="contract-info--block">
          <div className="contract-info--title bytecode">Contract Creation Code</div>
          <AceEditor value={getHex(contract.bytecode)} name="contract_bytecode" height="200px" showGutter={false} />
        </div>
        {hasConstructorArguments ? <div className="contract-info--block">
          <div className="contract-info--title arguments">Constructor Arguments
            <div className="contract-info__title--sub">(ABI-Encoded and is the last bytes of the Contract Creation Code above)</div>
          </div>
          <AceEditor value={getHex(contract.bytecode)} name="contract_bytecode" height="200px" showGutter={false} />
        </div> : null}
      </div>
    </>)
}