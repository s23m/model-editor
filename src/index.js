/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as ServiceWorker from './ServiceWorker';
import {MainProgramClass} from './UIElements/MainView';
import {assignElement} from "./UIElements/CanvasDraw";
import {getSaveData} from "./Serialisation/FileManager";


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

ReactDOM.render(<MainProgramClass />,document.getElementById("program"));
assignElement("drawCanvas");

// save to server every interval
setInterval(() => {
    let data = JSON.stringify(getSaveData());

    fetch('http://localhost:8080/serialisation/save',{
        method:'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Content-Length':data.length
        },
        body: data
    });
},60000);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
ServiceWorker.unregister();
