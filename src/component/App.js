import React, { Component } from 'react'
import BlocklyContainer from './BlocklyDiv'

const _TOOLBOX = `
    <xml>
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    </xml>
    `
class App extends Component {
  render() {
    return (
      <div>
        <h1>container is not in current document</h1>
        <BlocklyContainer
        ref="blocklyComponent"
        toolbox={_TOOLBOX}
        /> 
      </div>
    );
  }
}

export default App;
