import React, { Component } from "react";
import { browserHistory, Link } from "react-router"
import './styles.scss';

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.searchInput = React.createRef();
    this.searchType = React.createRef();
    this.handleSearch = this.handleSearch.bind(this);
  }
  handleSearch() {
    const type = this.searchType.value;
    const value = this.searchInput.value;
    switch (this.searchType.value) {
      case 'address':
        browserHistory.push(`/account/${value}`);
        this.searchInput.value = '';
        break;
      case 'block':
        browserHistory.push(`/blocks/${value}`);
        this.searchInput.value = '';
        break;
      case 'transaction':
        browserHistory.push(`/txs/${value}`);
        this.searchInput.value = '';
        break;
      case 'address':
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
    return (
      <div className="theta-header">
        <Link to="/" className="theta-header__logo">
          <div className="theta-logo"></div>
        </Link>
        <div className="theta-header__navigator">
          <Link to="/dashboard" className="theta-header__navigator--button">
            Overview
          </Link>
          <Link to="/blocks" className="theta-header__navigator--button">
            <div>Blocks</div>
          </Link>
          <Link to="/txs" className="theta-header__navigator--button">
            <div>Transaction</div>
          </Link>
        </div>
        <div className="theta-header__blank"></div>
        <div className="theta-header__search">
          <input className="theta-header__search--input" placeholder="Search" ref={input => this.searchInput = input} onKeyPress={e => this.handleEnterKey(e)} />
          <div className="theta-header__search--select">
            <select ref={option => this.searchType = option}>
              <option value="address">Address</option>
              <option value="block">Block Number</option>
              <option value="transaction">Transaction</option>
            </select>
          </div>
          <div className="theta-header__search--button" onClick={this.handleSearch}>
            <svg className="svg-icon" viewBox="0 0 20 20">
              <path fill="none" d="M19.129,18.164l-4.518-4.52c1.152-1.373,1.852-3.143,1.852-5.077c0-4.361-3.535-7.896-7.896-7.896
								c-4.361,0-7.896,3.535-7.896,7.896s3.535,7.896,7.896,7.896c1.934,0,3.705-0.698,5.078-1.853l4.52,4.519
								c0.266,0.268,0.699,0.268,0.965,0C19.396,18.863,19.396,18.431,19.129,18.164z M8.567,15.028c-3.568,0-6.461-2.893-6.461-6.461
                s2.893-6.461,6.461-6.461c3.568,0,6.46,2.893,6.46,6.461S12.135,15.028,8.567,15.028z"></path>
              {/* <path d="M18.125,15.804l-4.038-4.037c0.675-1.079,1.012-2.308,1.01-3.534C15.089,4.62,12.199,1.75,8.584,1.75C4.815,1.75,1.982,4.726,2,8.286c0.021,3.577,2.908,6.549,6.578,6.549c1.241,0,2.417-0.347,3.44-0.985l4.032,4.026c0.167,0.166,0.43,0.166,0.596,0l1.479-1.478C18.292,16.234,18.292,15.968,18.125,15.804 M8.578,13.99c-3.198,0-5.716-2.593-5.733-5.71c-0.017-3.084,2.438-5.686,5.74-5.686c3.197,0,5.625,2.493,5.64,5.624C14.242,11.548,11.621,13.99,8.578,13.99 M16.349,16.981l-3.637-3.635c0.131-0.11,0.721-0.695,0.876-0.884l3.642,3.639L16.349,16.981z"></path> */}
            </svg>
          </div>
        </div>
      </div>
    );
  }
}