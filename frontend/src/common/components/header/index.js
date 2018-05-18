import React, { Component } from "react";
import { Link } from "react-router"
// import './styles.scss';

export default class Header extends Component {
  render() {
    return (
      <div>
        this is a header
        <Link to="/dashboard">
          <button>Overview</button>
        </Link>
        <Link to="/blocks">
          <button>Blocks</button>
        </Link>
        <Link to="/txs">
          <button>Transaction</button>
        </Link>
      </div>
    );
  }
}