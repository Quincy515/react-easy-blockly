import React from 'react'
import Blockly from 'node-blockly'

const toolbox = `
         <xml>
           <block type="controls_if"></block>
           <block type="controls_whileUntil"></block>
         </xml>`

class BlocklyDiv extends React.Component {
    constructor() {
        super()
        this.state = {
            workspace: null
        }
    }
    componentDidMount() {
        this.setState({
            workspace: Blockly.inject(this.blocklyDiv, { toolbox: toolbox })
        })
         
    }
    render() {
        return (
            <div>
                <h2 >BlocklyDiv</h2>
                <div id="blocklyContainer">
                    <div id="blocklyDiv" ref={ref => this.blocklyDiv = ref} />
                </div>
            </div>
        )
    }
}
export default BlocklyDiv