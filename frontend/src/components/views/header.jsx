import React, { Component } from "react";
import { Link } from "react-router"
export default class Header extends Component {
  render() {
    return (
      <div>
        this is header
        <Link to="/home">
          <button>Overview</button>
        </Link>
        <Link to="/txs">
          <button>Transaction</button>
        </Link>
      </div>
    );
  }
}