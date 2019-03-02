import React from "react";


let DetailsRow = props => {
  return (
    <tr>
      <th>{props.label}</th>
      <td>{props.data}</td>
    </tr>)
}
export default DetailsRow;