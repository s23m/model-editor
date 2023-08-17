import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { getNewToken } from './GithubFunctionality';

export function GithubModal() {
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState('');

  const handleAccessTokenChange = event => {
    setAccessToken(event.target.value);
  };

  const handleUsernameChange = event => {
    setUsername(event.target.value);
  }

  const addUser = async event => {
    event.preventDefault();

    const githubUser = {
      username,
      accessToken,
    };
    localStorage.setItem('GithubUser', JSON.stringify(githubUser));
    setAccessToken('');
    setUsername('');
    let modal = document.getElementById('Github-Modal');
    modal.style.display = 'none';
    window.alert(`New Github user created: ${JSON.stringify(githubUser)}`);
  };

  return (
    <div className="modal" id="Github-Modal" style={{ display: 'none' }}>
      <Modal.Dialog id="Github-Modal-Dialog">
        <Modal.Header id="Github-Modal-Header">
          <Modal.Title style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            <strong>Github User Setup</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="Github-Modal-Body">
          <form onSubmit={addUser}>
            <div>
              <label>GitHub Username:</label>
              <input type="text" value={username} onChange={handleUsernameChange} />
            </div>
            <div>
              <label>Access Token:</label>
              <input type="text" value={accessToken} onChange={handleAccessTokenChange} />
            </div>
            <button type="submit">Add User</button>
          </form>
        </Modal.Body>
      </Modal.Dialog>
      <div>
        <Button variant="secondary" onClick={getNewToken}>Get Access Token</Button>
      </div>
    </div>
  )
}

export default GithubModal;