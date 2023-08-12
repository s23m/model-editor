








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