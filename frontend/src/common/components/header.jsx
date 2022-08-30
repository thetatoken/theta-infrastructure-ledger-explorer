import React from "react";
import history from 'common/history'
import { Link } from 'react-router-dom';
import tns from 'libs/tns';

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.searchInput = React.createRef();
    this.searchType = React.createRef();
    this.handleSearch = this.handleSearch.bind(this);
  }
  async handleSearch() {
    const value = this.searchInput.value;
    switch (this.searchType.value) {
      case 'address':
        if (value !== '') {
          if (value.endsWith(".theta")) {
            const address = await tns.getAddress(value);
            history.push(`/account/${address ? address : value}`);
            this.searchInput.value = '';
          } else {
            history.push(`/account/${value}`);
            this.searchInput.value = '';
          }
        }
        break;
      case 'block':
        history.push(`/blocks/${value}`);
        this.searchInput.value = '';
        break;
      case 'transaction':
        history.push(`/txs/${value}`);
        this.searchInput.value = '';
        break;
      default:
        break;
    }
  }
  handleEnterKey(e) {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  }
  render() {
    const isMetaChain = history.location.pathname.includes('metachain')
    return (
      <>
        <div className="theta-header-wrap">
          <div className="theta-header">
            <div className="nav">
              <Link to="/metachain" className="theta-logo"></Link>
              {isMetaChain && <a href="https://explorer.thetatoken.org/" className="nav-item" target="_blank" rel="noreferrer">METACHAIN</a>}
              <a href="https://wallet.thetatoken.org/" className="nav-item" target="_blank" rel="noreferrer">WALLET</a>
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
              <div className="nav-select__button">
                Go to chain
                <div className="select-arrow-down"></div>
              </div>
            </div>

          </div>
        </div>
        {!isMetaChain && <div className="chain-header-wrap theta">
          <div className="chain-header">
            <div className="chain-header__name">
              THETA MAIN CHAIN
            </div>
            <div className="chain-header__navbar">
              <Link to="/blocks" className="nav-item">BLOCKS</Link>
              <Link to="/txs" className="nav-item">TRANSACTIONS</Link>
              <Link to="/stakes" className="nav-item">STAKES</Link>
              <div className="nav-search">
                <input type="text" className="search-input" placeholder="address/block/tx search" ref={input => this.searchInput = input} onKeyPress={e => this.handleEnterKey(e)} />
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
      </>
    );
  }
}