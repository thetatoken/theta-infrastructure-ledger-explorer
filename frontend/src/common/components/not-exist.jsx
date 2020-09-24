import React from "react";


export default class NotExist extends React.PureComponent {
  render() {
    const { msg } = this.props;
    return (
      <div className="th-not-exist">
        {msg ? msg : 'Woops! This Object Does Not Exist.'}
      </div>
    );
  }
}
