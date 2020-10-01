import React, { useRef } from "react";

import LoadingPanel from 'common/components/loading-panel';
import { smartContractService } from 'common/services/smartContract';
import AceEditor from 'common/components/ace-editor';
import { getHex } from 'common/helpers/utils';

export default class SmartContractCode extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      smartContract: null,
      isReleasesReady: false,
      isVerified: false,
      isVerifying: false,
      isCodeEmpty: true
    }
  }
  componentDidMount() {
    this.fetchSmartContract(this.props.address)
  }
  componentDidUpdate(preProps) {
    if (this.props.address !== preProps.address) {
      this.fetchSmartContract(this.props.address)
    }
  }
  fetchSmartContract = (address) => {
    if (!address) {
      return;
    }
    smartContractService.getOneByAddress(address)
      .then(res => {
        switch (res.data.type) {
          case 'smart_contract':
            const smartContract = _.get(res, 'data.body')
            const isVerified = _.get(smartContract, 'verification_date')
            const hasSourceCode = _.get(smartContract, 'sourceCode')
            this.setState({
              smartContract: smartContract,
              isVerified: isVerified && hasSourceCode,
              errorType: null
            })
            if (!this.state.isVerified) {
              this.loadReleases(() => {
                this.setState({ isReleasesReady: true })
              })
            }
            break;
          case 'error_not_found':
            break;
          default:
            break;
        }
      }).catch(err => {
        console.log(err);
      })
  }
  loadReleases = (callback) => {
    const existingScript = document.getElementById('solReleases');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://solc-bin.ethereum.org/bin/list.js';
      script.id = 'solReleases';
      document.body.appendChild(script);

      script.onload = () => {
        if (callback) callback();
      };
    }
    if (existingScript && callback) callback();
  }
  setIsVerifing = (val) => {
    this.setState({ isVerifying: val })
  }

  render() {
    const { address } = this.props;
    const { smartContract, isReleasesReady, isVerifying } = this.state;
    const showView = _.get(smartContract, 'source_code.length')
    return (
      showView ? <CodeViewer contract={smartContract} /> : <CodeUploadWrapper address={address}
        smartContract={smartContract} isReleasesReady={isReleasesReady} isVerifying={isVerifying}
        setIsVerifing={this.setIsVerifing} fetchSmartContract={this.fetchSmartContract} />
    )
  }
}
const CodeUploadWrapper = props => {
  const { address, smartContract, isReleasesReady, isVerifying, setIsVerifing, fetchSmartContract } = props;
  return (isVerifying ?
    <>
      <div className="code-loading-text">Verifying your source code......</div>
      <LoadingPanel />
    </>
    : <CodeUploader isReleasesReady={isReleasesReady} smartContract={smartContract} address={address}
      setIsVerifing={setIsVerifing} fetchSmartContract={fetchSmartContract} />
  )
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
  const { isReleasesReady, address, setIsVerifing, fetchSmartContract } = props;
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
    setIsVerifing(true);
    smartContractService.verifySourceCode(address, byteCode, sourceCode, abi, version, optimizer)
      .then(res => {
        setIsVerifing(false);
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
      </div>
    </>)
}