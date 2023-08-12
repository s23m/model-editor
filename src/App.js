/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

import './App.css';


function App() {

  return (

    <div className="App">
      <div className="modal" style={{ display: 'none', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} id="Github-Modal">
        <Modal.Dialog id="Github-Modal-Dialog">
          <Modal.Header id="Github-Modal-Header">
            <Modal.Title>Github Authorisation Setup</Modal.Title>
          </Modal.Header>

          <Modal.Body id="Github-Modal-Body">
            <InputGroup className="mb-3">
              <InputGroup.Text id="inputGroup-sizing-default">
                Github Username
              </InputGroup.Text>
              <Form.Control
                aria-label="Default"
                aria-describedby="inputGroup-sizing-default"
              />
            </InputGroup>
            <InputGroup.Text id="inputGroup-sizing-default">
              Github Email
            </InputGroup.Text>
            <InputGroup.Text id="inputGroup-sizing-default">
              Client_ID
            </InputGroup.Text>
            <InputGroup.Text id="inputGroup-sizing-default">
              Client_Secret
            </InputGroup.Text>

          </Modal.Body>

          <Modal.Footer id="Github-Modal-Footer">
            <Button variant="primary">Save changes</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </div>
      <div id='program'>
      </div>
    </div>

  );


}


export default App;
