import React, { Component } from 'react'
import BlocklyDiv from './BlocklyDiv'
import '../css/App.css'

class App extends Component {
  render() {
    return (
      <div>
        <h1>container is not in current document</h1>
        <BlocklyDiv/> 
      </div>
    );
  }
}

export default App;
