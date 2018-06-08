import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';

const nameMap = {
  'address': 'Address',
  'balance': 'Balance',
}

export default class UserExplorerTable extends Component {
  render() {
    const { userInfo } = this.props;
    return (
      <div className="th-be-table">
        {Object.keys(userInfo).map(key => {
          return (
            <div className="th-be-table__row" key={key}>
              <div className="th-be-table__row--left">
                <p className="th-be-table-text">{nameMap[key]}</p>
              </div>
              <div className="th-be-table__row--right">
                <div className="th-be-table-text">
                  {userInfo[key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    );
  }
}
