import axios from 'axios';

const GITHUB_TOKEN_PAGE = 'https://github.com/settings/tokens/new';

export async function getNewToken() {
  window.open(GITHUB_TOKEN_PAGE);
}

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
    window.alert('Github user call test success');
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);

    if (error.message === 'User data not found in local storage') {
      window.alert('User not found in local storage.\n\n Add a user by clicking Github Account button.');
    } else if (error.response) {
      const status = error.response.status;

      if (status === 304) {
        console.log('Resource not modified since last request.');
      } else if (status === 401) {
        window.alert('Incorrect Credentials \n\n Please ensure your Github username and access token are correct.');
      } else if (status === 403) {
        window.alert('\n\n You do not have permission to access this resource.');
      } else {
        window.alert('An error occurred. Please try again later.');
      }
    } else {
      window.alert('An error occurred. Please check your internet connection.');
    }
  }
};

export const createUserRepo = async () => {
  const githubUser = JSON.parse(localStorage.getItem('GithubUser'));
  const reponame = window.prompt("What would you like to name the repository?");
  if (githubUser) {
    try {
      const response = await axios.post('https://api.github.com/user/repos', {
        name: reponame,
        private: true,
      }, {
        headers: {
          Authorization: `Bearer ${githubUser.accessToken}`,
        },
      });
      const status = response.status
      if (status === 200 || status === 201) {
        const repoData = response.data;
        console.log('Repository created:', repoData);
        window.alert('Repository has been successfully created.');
      } else if (status === 404) {
        window.alert('Unable to locate GitHub API endpoint.');
      } else if (status === 409) {
        window.alert('Repository already exists.  Choose a different repository name.');
      } else if (status === 422) {
        window.alert('Unable to process request. Check your input data.');
      }
    } catch (error) {
     
        window.alert(`An error occurred while creating the repository for ${githubUser.username}. Please ensure credentials are correct`);
     
      console.error(`Error creating Github repo for ${githubUser.username}:`, error);
    }
  } else {
    window.alert('No github user found in localStorage\n\nTry adding one with the "Github Account" button');
    console.log('github user not found');
  }
};