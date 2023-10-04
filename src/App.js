/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import { GithubModal } from './OAuthUsers/GithubModal';
import './App.css';

const closePopup = () => {
  const container = document.getElementById("popup");
  container.style.display = "none";
}

function App() {
  return (
    <div className="App">
      <GithubModal />
      <div id="popup">
        <span className="close-popup" onClick={closePopup}>X</span>
        <div id="file-list"></div>
      </div>
      <div id='program'>
      </div>
    </div>
  );
}

export default App;
