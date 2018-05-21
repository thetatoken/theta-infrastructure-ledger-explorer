import React, { Component } from "react";
import { Link } from "react-router"
import './styles.scss';

export default class Header extends Component {
  render() {
    return (
      <div className="theta-header">
        <Link to="/" className="theta-header__logo">
          Theta
          {/* <div className="theta-logo"></div> */}
        </Link>
        <div className="theta-header__navigator">
          <Link to="/dashboard" className="theta-header__navigator--button">
            <div>Overview</div>
          </Link>
          <Link to="/blocks" className="theta-header__navigator--button">
            <div>Blocks</div>
          </Link>
          <Link to="/txs" className="theta-header__navigator--button">
            <div>Transaction</div>
          </Link>
        </div>
      </div>
    );
  }
}