import React, { Component } from "react";
import './styles.scss';

export default class NotExist extends Component {
  render() {
    return (
      <div className="th-not-exist">
        Woops! This Object Does Not Exist.
      </div>
    );
  }
}
