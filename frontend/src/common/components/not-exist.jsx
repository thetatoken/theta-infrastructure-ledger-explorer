import React from "react";


export default function NotExist(props){
  const { msg } = props;
  return (
    <div className="th-not-exist">
      {msg ? msg : 'Woops! This Object Does Not Exist.'}
    </div>
  );
}
