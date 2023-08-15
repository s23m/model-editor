// model-editor opens
// click github account button
// modal allows user to enter username and email
// navigate button redirects to github page (to add an OAuth application)
// user adds OAuth app, retrieves client ID and client Secret
// user takes those values and enters them in respective field in the modal
// retrieveproperties




const GITHUB_OAUTH_APPS = 'https://github.com/settings/developers';
const GITHUB_OAUTH_PAGE = 'https://github.com/login/oauth/authorize?client_id=';


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

  setAccessToken(token){
    this.accessToken = token;
  }

  navigateToSettings(){
    window.location.assign(GITHUB_OAUTH_APPS);
  }

  loginWithGithub() {
    window.location.assign(GITHUB_OAUTH_PAGE + this.clientId);
  }
}

export function retrieveProperties(){
  const githubUser = {};
  let fields = document.getElementsByClassName('Github-User-Fields');
  for (let element of fields){

  }
}



