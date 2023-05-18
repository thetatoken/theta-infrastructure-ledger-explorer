import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import get from 'lodash/get';

import LoadingPanel from 'common/components/loading-panel';
import AceEditor from 'common/components/ace-editor';
import { Accordion, AccordionHeader } from 'common/components/accordion';
import { getHex, getArguments } from 'common/helpers/utils';
import { smartContractService } from 'common/services/smartContract';
import { useDropzone } from 'react-dropzone';

export default class SmartContractCode extends React.PureComponent {
  setStates = (keys, vals) => {
    let newState = {}
    keys.forEach((key, i) => {
      newState[key] = vals[i]
    })
    this.setState(newState);
  }
  render() {
    const { address, smartContract, isReleasesReady, isLoading, fetchSmartContract } = this.props;
    const showView = get(smartContract, 'source_code.length')
    return (
      isLoading ? <LoadingPanel /> :
        showView ? <CodeViewer contract={smartContract} /> : <CodeUploader isReleasesReady={isReleasesReady}
          smartContract={smartContract} address={address} fetchSmartContract={fetchSmartContract} />
    )
  }
}

const Options = () => {
  let releases = window.soljsonReleases;
  return (
    <>
      <option value='' key='empty'>[Please select]</option>
      {Object.keys(releases).map(key => {
        let text = releases[key].match(/^soljson-(.*).js$/)[1];
        return (<option value={key} key={key}>{text}</option>)
      })}
    </>
  )
}
const CodeUploader = props => {
  const { isReleasesReady, address, fetchSmartContract } = props;
  const [isSingleFile, setIsSingleFile] = useState(true);
  const [isCodeEmpty, setIsCodeEmpty] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [uploaderSourceCode, setUploaderSourceCode] = useState('');
  const [uploaderAbi, setUploaderAbi] = useState('');
  const [uploaderVersion, setUploaderVersion] = useState('');
  const [uploaderOptimizer, setUploaderOptimizer] = useState(0);
  const [files, setFiles] = useState([]);
  const sourceCodeRef = useRef(null);
  const versionRef = useRef(null);
  const optimizerRef = useRef(null);
  const optimizerRunsRef = useRef(null);
  const abiRef = useRef(null);
  const libRefs = useRef([]);
  // const libArr = new Array(10);
  Array.from({ length: 10 }).forEach((_, index) => {
    libRefs.current[index] = [useRef(), useRef()];
  });
  // console.log('libArr:', libArr)
  console.log('libRefs:', libRefs)
  useEffect(() => {
    if (sourceCodeRef.current) {
      sourceCodeRef.current.value = uploaderSourceCode;
      abiRef.current.value = uploaderAbi;
      optimizerRef.current.value = uploaderOptimizer;
    }
    if (versionRef.current) versionRef.current.value = uploaderVersion;
  }, [sourceCodeRef.current, versionRef.current]);

  const reset = () => {
    sourceCodeRef.current.value = '';
    abiRef.current.value = '';
  }
  const submit = async () => {
    const fileObj = {};
    if (!isSingleFile) {
      for (let i = 0; i < files.length; i++) {
        const fileContents = await readFileAsync(files[i]);
        fileObj[files[i].name] = { content: fileContents };
      }
    }
    console.log('fileObj:', fileObj)
    const sourceCode = isSingleFile ? sourceCodeRef.current.value : JSON.stringify(fileObj);
    const version = versionRef.current.value;
    const versionFullname = window.soljsonReleases[version]
    const abi = abiRef.current.value;
    const optimizer = optimizerRef.current.value;
    const optimizerRuns = optimizerRunsRef.current.value;
    console.log('optimizerRuns:', optimizerRuns);
    const byteCode = get(props, 'smartContract.bytecode');
    setUploaderSourceCode(sourceCode);
    setUploaderAbi(abi);
    setUploaderVersion(version);
    setUploaderOptimizer(optimizer);
    if (sourceCode === '') {
      setIsCodeEmpty(true);
      sourceCodeRef.current.focus();
      return;
    } else if (isCodeEmpty) {
      setIsCodeEmpty(false);
    }
    if (version === '') {
      versionRef.current.classList.add('isEmpty');
      versionRef.current.focus();
      return;
    }

    // return;
    setIsVerifying(true);

    // return;
    smartContractService.verifySourceCode(address, sourceCode, abi, version, versionFullname, optimizer, optimizerRuns, isSingleFile)
      .then(res => {
        setIsVerifying(false);
        console.log('res from verify source code:', res);
        let isVerified = get(res, 'data.result.verified')
        let error = get(res, 'data.err_msg')
        console.log('result: ', isVerified)
        if (isVerified === true) { fetchSmartContract(address) }
        else if (error) { setErrMsg(error) }
        else setErrMsg('Code does not match.')
      }).catch(e => {
        setIsVerifying(false);
        setErrMsg('Something wrong in the verification process.')
        console.log('error:', e)
      })
  }
  const resetBorder = e => {
    if (e.target.value === '') {
      e.target.classList.add('isEmpty')
    } else {
      e.target.classList.remove('isEmpty')
    }
  }
  const handleSwitch = () => {
    setIsSingleFile(!isSingleFile);
    if (files.length > 0) setFiles([]);
    if (isCodeEmpty) setIsCodeEmpty(false);
  }
  return (isVerifying ?
    <>
      <div className="code-loading-text">Verifying your source code......</div>
      <LoadingPanel />
    </>
    :
    <>
      <div className="selects-container">
        {isReleasesReady ? <div className="select__container">
          <label>Please select Compiler Version</label>
          <div className="select__selector">
            <select ref={versionRef} defaultValue='' onChange={resetBorder}>
              <Options />
            </select>
          </div>
        </div> : ''}
        <div className="select__container optimizer">
          <label>
            <div className="select__tooltip question-mark">?
              <div className="select__tooltip--text">
                Select the option you used when compiling this contract.
              </div>
            </div>
            Optimization
          </label>
          <div className="select__selector optimizer">
            <select ref={optimizerRef} defaultValue={0}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>
        <div className="select__container switch">
          <div className="switch" onClick={handleSwitch}>
            <div className="switch__logo" ></div>
            {isSingleFile ? "Upload Multiple Files" : "Upload Single File"}
          </div>
        </div>
      </div>
      {isSingleFile ? <>
        <label htmlFor="txtSourceCode">
          <b>Enter the Solidity Contract Code below &nbsp;</b>
          {/* <span className="text-danger">*</span> */}
          {/* <span className="text-danger">{isCodeEmpty ? 'source code is reqired. ' : ''}Only Single File Supported</span> */}
          <span className="text-danger">{isCodeEmpty ? '*source code is reqired. ' : ''}</span>
        </label>
        <textarea className='code-area' placeholder="Enter your code here." name="txtSourceCode" ref={sourceCodeRef} required />
      </> : <>
        <FileInput setfiles={setFiles} files={files} isCodeEmpty={isCodeEmpty} />
      </>}
      <Accordion
        header={<AccordionHeader
          title="Constructor Arguments ABI-encoded"
          subTitle="(for contracts that were created with constructor parameters)"
        />}
        body={<textarea className='abi-area' placeholder="Enter your code here." ref={abiRef} />} />
      <Accordion
        header={<AccordionHeader
          title="Contract Library Address "
          subTitle="(for contracts that use libraries, supports up to 10 libraries)"
        />}
        body={<div className="sc-library">
          <div className="sc-library__note">Note: Library names are case sensitive and affects the keccak library hash</div>
          <div className="sc-libraries">
            {Array.from({ length: 10 }).map((_, index) => {
              return <div className="sc-library__row" key={index}>
                <div className="sc-library__section">
                  <div className="sc-library__section--title">Library #{index + 1} Name:</div>
                  <input className="sc-library__section--input" type="text" ref={ref => (libRefs.current[index][0].current = ref)} />
                </div>
                <div className="sc-library__arrow">
                  <div></div>
                  <div className="sc-library__arrow right"></div>
                </div>
                <div className="sc-library__section">
                  <div className="sc-library__section--title">Library #{index + 1} Contract Address:</div>
                  <input className="sc-library__section--input" type="text" ref={ref => (libRefs.current[index][1].current = ref)} />
                </div>
              </div>
            })}
          </div>
        </div>} />
      <Accordion
        header={<AccordionHeader
          title="Misc Settings"
          subTitle="(Runs & EvmVerion Settings)"
        />}
        body={<>
          <div className="setting-section">
            <label>
              <div className="setting-section__tooltip question-mark">?
                <div className="setting-section__tooltip--text">
                  <p>
                    (Applicable when Optimization = Yes) <br />
                    Optimize for how many times you intend to run the code.Lower values will optimize more for initial deployment cost,
                    higher values will optimize more for high-frequency usage.
                  </p>
                </div>
              </div>
              Runs (Optimizer)
              <div className="setting-section__tooltip">
                <input type="number" defaultValue={200} placeholder={200} ref={optimizerRunsRef} />
                <div className="setting-section__tooltip--text">
                  Do not change if you are unsure. Previous versions of truffle defaulted to a value of 0
                </div>
              </div>
            </label>
          </div>
          <div className="setting-section">
            <label>
              <div className="setting-section__tooltip question-mark">?
                <div className="setting-section__tooltip--text">
                  When you compile your contract code you can specify the Ethereum virtual machine version to
                  compile for to avoid particular features or behaviours.
                </div>
              </div>
              EVM Version to target
              <div className="setting-section__tooltip">
                <select defaultValue='default' disabled>
                  <option value='default'>default (complier defaults)</option>
                </select>
                <div className="setting-section__tooltip--text">
                  A list of target EVM versions and the compiler-relevant changes introduced at each version.
                  Backward compatibility is not guaranteed between each version.
                </div>
              </div>
            </label>
          </div>
        </>} />
      {errMsg.length ? <div className='code-error-text text-danger'>Validation failed with an error: {errMsg}</div> : null}
      <div className="code-buttons">
        <div onClick={submit}>Verify and Publish</div>
        <div className='reset' onClick={reset}>Reset</div>
      </div>
    </>
  )
}

const SettingSection = props => {
  return <div className="setting-section">
    <label>
      <div className="setting-section__tooltip question-mark">?
        <div className="setting-section__tooltip--text">
          <p>
            (Applicable when Optimization = Yes) <br />
            Optimize for how many times you intend to run the code.Lower values will optimize more for initial deployment cost,
            higher values will optimize more for high-frequency usage.
          </p>
        </div>
      </div>
      Runs (Optimizer)
      <div className="setting-section__tooltip">
        <input type="number" />
        <div className="setting-section__tooltip--text">
          Do not change if you are unsure. Previous versions of truffle defaulted to a value of 0
        </div>
      </div>
    </label>
  </div>
}
const CodeViewer = props => {
  const { contract } = props;
  let args = get(contract, 'constructor_arguments');
  const hasConstructorArguments = args ? args.length > 0 : false;
  const jsonAbi = contract.abi.map(obj => JSON.stringify(obj))
  return (
    <>
      <div className="contract-info">
        <div className="contract-info__block">
          <div className="contract-info__title verified">Contract Source Code Verified</div>
          <div className="contract-info__general">
            <div className="contract-info__raws">
              <div className="contract-info__cell">
                <div>Contract Name:</div>
                <div>{contract.name}</div>
              </div>
              <div className="contract-info__cell">
                <div>Compiler Version:</div>
                <div>{contract.compiler_version}</div>
              </div>
            </div>
            <div className="contract-info__raws">
              <div className="contract-info__cell">
                <div>Optimization Enabled:</div>
                <div>
                  <b>{contract.optimizer === 'enabled' ? 'Yes' : 'No'}</b> with
                  <b>
                    {contract.optimizer === 'enabled' ? contract.optimizerRuns ? ' ' + contract.optimizerRuns : ' 200' : ' 0'}
                  </b> runs
                </div>
              </div>
              <div className="contract-info__cell">
                <div>Other Settings:</div>
                <div><b>default</b> evmVersion</div>
              </div>
            </div>
          </div>
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title source-code">Contract Source Code (Solidity)</div>
          <AceEditor value={contract.source_code} name="contract_source_code" />
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title abi">Contract ABI</div>
          <AceEditor value={'[' + jsonAbi + ']'} name="contract_abie" height="200px" showGutter={false} />
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title bytecode">Contract Creation Code</div>
          <AceEditor value={getHex(contract.bytecode)} name="contract_bytecode" height="200px" showGutter={false} />
        </div>
        {hasConstructorArguments ? <div className="contract-info__block">
          <div className="contract-info__title arguments">Constructor Arguments
            <div className="contract-info__title--sub">(ABI-Encoded and is the last bytes of the Contract Creation Code above)</div>
          </div>
          <AceEditor value={getArguments(contract.constructor_arguments)} name="contract_bytecode" height="200px" showGutter={false} />
        </div> : null}
      </div>
    </>)
}

const FileInput = props => {
  const { name, label = name, setfiles, files, isCodeEmpty } = props;
  const [rejectedFiles, setRectjectFiles] = useState([]);
  const onDropAccepted = useCallback(
    (acceptedFiles) => {
      // filter out any files that do not have the ".sol" extension
      const solFiles = acceptedFiles.filter(file => file.name.endsWith('.sol'));
      const rejFiles = acceptedFiles.filter(file => !file.name.endsWith('.sol'));
      setfiles(solFiles);
      setRectjectFiles(rejFiles);
    },
    []
  );
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles } = useDropzone({
    onDropAccepted,
    accept: ".sol",
    multiple: true
    // onDrop: (acceptedFiles) => {
    //   console.log('acceptedFiles:', acceptedFiles);
    //   setfiles(acceptedFiles);
    // },

  });
  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);

  return (
    <>
      <div className="file-uploader">
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p className="file-uploader__label">Drag and drop some .sol files here, or click to select .sol files</p>
          <p className="file-uploader__tooltip">(CTRL click to select multiple files)</p>
          <div className="file-uploader__preview">
            {files.length === 0 ? <div className="file-uploader__preview--empty">
              <span>No file selected</span>
              {isCodeEmpty && <span className="text-danger">*source code is reqired.</span>}
            </div> : <div className="file-uploader__file-wrap">
              {files.map(file => {
                return <div className="file-uploader__file" key={file.path}>{file.name}</div>
              })}
            </div>}
          </div>
        </div>
      </div>
      {rejectedFiles.length > 0 && <div className="rejected-file">
        WRONG TYPE OF FILES: {rejectedFiles.map(file => {
          return <div key={file.name} className="rejected-file__name">
            {file.name}
          </div>
        })}
      </div>}
    </>
  )
}

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  borderWidth: 2,
  borderRadius: 8,
  borderColor: '#2C2F40',
  borderStyle: 'dashed',
  backgroundColor: '#191D29',
  color: '#8A8FB5',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

const activeStyle = {
  borderColor: '#18C99D'
};

const acceptStyle = {
  borderColor: '#18C99D'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      const fileContents = reader.result;
      resolve(fileContents);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
  });
}