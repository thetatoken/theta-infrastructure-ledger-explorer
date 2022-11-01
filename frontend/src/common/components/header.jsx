import React from "react";
import history from 'common/history'
import { Link } from 'react-router-dom';
import tns from 'libs/tns';
import ChainCard from "./chain-card";
import { validateHex } from "../helpers/utils";
import config from "../../config";

const host = window.location.host;
const isMetaChain = host.match(/metachain-explorer/gi) !== null;

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMetaChain: isMetaChain,
      isOpen: false,
      hasError: false
    };
    this.searchInput = React.createRef();
    this.searchType = React.createRef();
    this.handleSearch = this.handleSearch.bind(this);
    this.handleOnClose = this.handleOnClose.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
  }
  async handleSearch() {
    const value = this.searchInput.value;
    if (value.endsWith(".theta")) {
      const address = await tns.getAddress(value);
      history.push(`/account/${address ? address : value}`);
      this.searchInput.value = '';
      return;
    }
    if (validateHex(value, 40)) {
      history.push(`/account/${value}`);
      this.searchInput.value = '';
      return;
    }
    if (validateHex(value, 64)) {
      history.push(`/txs/${value}`);
      this.searchInput.value = '';
      return;
    }
    if (!isNaN(value)) {
      history.push(`/blocks/${value}`);
      this.searchInput.value = '';
      return;
    }
  }
  handleOnChange(e) {
    const { hasError } = this.state;
    let value = e.target.value;
    console.log('value:', isNaN(value));
    if (value.endsWith(".theta") || validateHex(value, 40) || validateHex(value, 64) || !isNaN(value)) {
      if (hasError) {
        this.setState({ hasError: false })
      }
      return;
    }
    this.setState({ hasError: true });
  }
  handleEnterKey(e) {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  }
  handleOnClose() {
    this.setState({ isOpen: false })
  }
  componentDidMount() {
    history.listen((location) => this.setState({ isMetaChain: location.pathname.includes('metachain') }));
  }
  render() {
    const { isMetaChain, isOpen, hasError } = this.state;
    const { version, switchVersion } = this.props;

    return (
      <>
        {version === '4' ? <>
          <div className="theta-header-wrap">
            <div className="theta-header">
              <div className="nav">
                <a href={config.chainInfo.metachain.host} className="theta-logo"></a>
                <a href={config.chainInfo.metachain.host} className="nav-item">METACHAIN</a>
                <a href="https://www.thetatoken.org/wallet" className="nav-item" target="_blank" rel="noreferrer">WALLET</a>
                <a href="https://docs.thetatoken.org/" className="nav-item" target="_blank" rel="noreferrer">DOCS</a>
                <a href="https://www.thetatoken.org/" className="nav-item" target="_blank" rel="noreferrer">LEARN MORE</a>
                <div className="nav-icons">
                  <a className="nav-icons__link" href="https://twitter.com/Theta_Network"
                    target="_blank" rel="noopener noreferrer">
                    <div className="nav-icons__link--icon twitter"></div>
                  </a>
                  <a className="nav-icons__link" href="https://www.reddit.com/r/theta_network"
                    target="_blank" rel="noopener noreferrer">
                    <div className="nav-icons__link--icon reddit"></div>
                  </a>
                  <a className="nav-icons__link" href="https://discord.gg/vCXJd5YKDt"
                    target="_blank" rel="noopener noreferrer">
                    <div className="nav-icons__link--icon discord"></div>
                  </a>
                  <a className="nav-icons__link" href="https://github.com/thetatoken"
                    target="_blank" rel="noopener noreferrer">
                    <div className="nav-icons__link--icon github"></div>
                  </a>
                </div>
              </div>
              <div className="nav-select">
                <div className="nav-select__button" onClick={() => this.setState({ isOpen: true })}>
                  Go to chain
                  <div className="select-arrow-down"></div>
                </div>
              </div>
              <div className="version-switch" onClick={switchVersion}>
                <div className="version-switch__logo" ></div>
                Switch to old version
              </div>
            </div>
          </div>
          {!isMetaChain && <div className="chain-header-wrap theta">
            <div className="chain-header">
              <Link className="chain-header__name" to="/">
                {config.chainName || 'THETA TESTNET MAIN CHAIN'}
              </Link>
              <div className="chain-header__navbar">
                <Link to="/blocks" className="nav-item">BLOCKS</Link>
                <Link to="/txs" className="nav-item">TRANSACTIONS</Link>
                <Link to="/stakes" className="nav-item">STAKES</Link>
                <div className={`nav-search ${hasError ? 'error' : ''}`}>
                  <input type="text" className="search-input" placeholder="address/block height/tx hash search" ref={input => this.searchInput = input} onKeyPress={e => this.handleEnterKey(e)} onChange={this.handleOnChange} />
                  <div className="search-button" onClick={this.handleSearch}>
                    <svg className="svg-icon" viewBox="0 0 20 20">
                      <path fill="none" d="M19.129,18.164l-4.518-4.52c1.152-1.373,1.852-3.143,1.852-5.077c0-4.361-3.535-7.896-7.896-7.896
								c-4.361,0-7.896,3.535-7.896,7.896s3.535,7.896,7.896,7.896c1.934,0,3.705-0.698,5.078-1.853l4.52,4.519
								c0.266,0.268,0.699,0.268,0.965,0C19.396,18.863,19.396,18.431,19.129,18.164z M8.567,15.028c-3.568,0-6.461-2.893-6.461-6.461
                s2.893-6.461,6.461-6.461c3.568,0,6.46,2.893,6.46,6.461S12.135,15.028,8.567,15.028z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>}
          {isOpen && <ChainCard onClose={this.handleOnClose} />}
        </> : <div className="theta-header-v3">
          <div className="nav">
            <Link to="/" className="theta-logo"></Link>
            <Link to="/blocks" className="nav-item">Blocks</Link>
            <Link to="/txs" className="nav-item">Transactions</Link>
            <Link to="/stakes" className="nav-item">Stakes</Link>
            <a href="https://www.thetatoken.org/" className="nav-item">Learn More</a>
          </div>
          <div className="nav-search">
            <input type="text" className="search-input" placeholder="Search" ref={input => this.searchInput = input} onKeyPress={e => this.handleEnterKey(e)} />
            <div className="search-button" onClick={this.handleSearch}>
              <svg className="svg-icon" viewBox="0 0 20 20">
                <path fill="none" d="M19.129,18.164l-4.518-4.52c1.152-1.373,1.852-3.143,1.852-5.077c0-4.361-3.535-7.896-7.896-7.896
								c-4.361,0-7.896,3.535-7.896,7.896s3.535,7.896,7.896,7.896c1.934,0,3.705-0.698,5.078-1.853l4.52,4.519
								c0.266,0.268,0.699,0.268,0.965,0C19.396,18.863,19.396,18.431,19.129,18.164z M8.567,15.028c-3.568,0-6.461-2.893-6.461-6.461
                s2.893-6.461,6.461-6.461c3.568,0,6.46,2.893,6.46,6.461S12.135,15.028,8.567,15.028z"></path>
              </svg>
            </div>
            <div className="search-select">
              <select ref={option => this.searchType = option}>
                <option value="address">Address</option>
                <option value="block">Block Height</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>
          </div>
          <div className="version-switch" onClick={switchVersion}>
            <div className="version-switch__logo" ></div>
            Switch to new version
          </div>
        </div>}
      </>
    );
  }
}