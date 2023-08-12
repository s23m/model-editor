






//-------Lee's github stuff-----------
//const CLIENT_ID = "180fba17230e08fc195f";
//const CLIENT_SECRET = "44c1d4c9b95762428306f34b317459c1552d4a06";
//------------------------------------

export class GitHubUser {

  constructor(userName, userEmail, clientId, clientSecret){
    this.userName = userName;
    this.userEmail = userEmail;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.code = null;
    this.accessToken = null;
  }

  setCode(code){
    this.code = code;
  }

}

export function loginWithGithub(client) {
  window.location.assign("https://github.com/login/oauth/authorize?client_id=" + client);
}