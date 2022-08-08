/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';

import './App.css';
import  {ContextMenu} from "./UIElements/ContextMenu";

function App() {

  let xPos = 0;
  let yPos = 0;

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    let xPos = event.pageX + "px";
    let yPos = event.pageY + "px";
  });


  return (
 
        <div className="App">
            <div id='program'>
            </div>
            <ContextMenu style={{ top: xPos, left: yPos }} />
        </div>

  );


}


export default App;
