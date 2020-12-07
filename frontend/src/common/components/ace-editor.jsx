import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-monokai";

export default function NewAceEditor(props) {
  const { value, height, name, showGutter } = props;
  return (
    <AceEditor
      mode="java"
      theme="monokai"
      value={value}
      width='100%'
      height={height}
      name={name}
      showGutter={showGutter}
      showPrintMargin={false}
      wrapEnabled={true}
      editorProps={{
        $blockScrolling: true,
      }}
      setOptions={{
        readOnly: true,
        highlightActiveLine: false,
        indentedSoftWrap: false,
        behavioursEnabled: false
      }}
    />
  )
}