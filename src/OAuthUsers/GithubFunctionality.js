import axios from 'axios';
import { getSaveData } from '../Serialisation/NewFileManager';

const GITHUB_TOKEN_PAGE = 'https://github.com/settings/tokens/new';

/**
 * Simple function which redirects users to the GitHub page for generating a token
 */
export async function getNewToken() {
  window.open(GITHUB_TOKEN_PAGE);
}

/**
 * This function is used to test if the github api calls are working and can return all the user data for the GithubUser which has been stored in localStorage
 */
export const fetchUserData = async () => {
  try {
    const githubUser = JSON.parse(localStorage.getItem('GithubUser'));
   
    if (!githubUser) {
      throw new Error('User data not found in local storage');
    }

    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${githubUser.accessToken}`,
      },
    });

    const githubUserData = response.data;
    console.log('GitHub User Data:', githubUserData);
    window.alert(`Github user call test success!!!\n\nusername: ${githubUserData.login}\n\nurl: ${githubUserData.html_url}`);
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);

    if (error.message === 'User data not found in local storage') {
      window.alert('User not found in local storage.\n\nAdd a user by clicking Github Account button.');
    } else if (error.response) {
      const status = error.response.status;

      if (status === 304) {
        console.log('Resource not modified since last request.');
      } else if (status === 401) {
        window.alert('Incorrect Credentials\n\nPlease ensure your Github username and access token are correct.');
      } else if (status === 403) {
        window.alert('You do not have permission to access this resource.');
      } else {
        window.alert('An error occurred. Please try again later.');
      }
    } else {
      window.alert('An error occurred. Please check your internet connection.');
    }
  }
};

/**
 * Function which creates a personal Model-Repository, currently with a static name declaration. Future iteration could allow for naming of Repositories.
 */
export const createUserRepo = async () => {
  const githubUser = JSON.parse(localStorage.getItem('GithubUser'));
  const reponame = 'Model-Repository'; // will go back to dynamic naming once we progress further

  if (githubUser) {
    axios.post('https://api.github.com/user/repos', {
      name: reponame,
      private: true,
    }, {
      headers: {
        Authorization: `Bearer ${githubUser.accessToken}`,
      }      
    })
    .then(response => {
      window.alert(`success!`);
      console.log(response);
      window.open(response.data.html_url);
    })
    .catch(error => {
      window.alert(`${error.message}\n\n${JSON.stringify(error.response.data.errors)}`);
      console.log(error);
    });
  } else {
    window.alert('No GitHub user found in localStorage.\n\nTry adding one with the "Github Account" button');
    console.log('GitHub user not found');
  }
};

/**
 * Function which uploads the current up to date JSON Serialisation to the Model-Repository which was created in the "createUserRepo" function.
 */
export const uploadFileToRepo = async () => {
  const githubUser = JSON.parse(localStorage.getItem('GithubUser'));
  if(githubUser){
    const owner = githubUser.username;
    const repo = 'Model-Repository';    
    const accessToken = githubUser.accessToken;
    const jsonData = getSaveData();
    const fileName = window.prompt("What would you like to name your file?");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}.json`;

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        "Content-Type": 'application/json',
      }
    }

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const base64Data = Buffer.from(jsonContent).toString('base64');

    axios.get(apiUrl, config)
      .then(response => {
        const requestData = {
          message: `Updating ${fileName}`,
          content: base64Data,
          sha: response.data.sha
        };

        return axios.put(apiUrl, requestData, config);
      })
      .catch(error => {
        if(error.response.status === 404) {
          const requestData = {
            message: `Uploading ${fileName}`,
            content: base64Data,
          };

          return axios.put(apiUrl, requestData, config);
        } else {
          console.error('Error: ', error);
        }
      })
      .then(response => {
        console.log('successful', response.data);
      })
      .catch(error => {
        console.error('Error uploading or updating file: ', error);
      });
  }
}