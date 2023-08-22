import axios from 'axios';

const GITHUB_TOKEN_PAGE = 'https://github.com/settings/tokens/new';

export async function getNewToken() {
  window.open(GITHUB_TOKEN_PAGE);
}

export const fetchUserData = async () => {
  const githubUser = JSON.parse(localStorage.getItem('GithubUser'));

  if (githubUser) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubUser.accessToken}`,
        },
      });

      const githubUserData = response.data;
      console.log('GitHub User Data:', githubUserData);
      window.alert(JSON.stringify(githubUserData));
    } catch (error) {
      console.error('Error fetching GitHub user data:', error);
    }
  } else {
    window.alert(`No github user found in localStorage\n\nTry adding one with the "Github Account" button`);
    console.log('GitHub user data not found in localStorage');
  }
};

export const createUserRepo = async () => {
  const githubUser = JSON.parse(localStorage.getItem('GithubUser'));

  if (githubUser) {
    try {
      const response = await axios.post('https://api.github.com/user/repos', {
        name: `Model-Repository`,
        private: true,
      }, {
        headers: {
          Authorization: `Bearer ${githubUser.accessToken}`,
        },
      });

    } catch (error) {
      console.error(`Error creating Github repo for ${githubUser.username}:`, error);
    }
  } else {
    window.alert('No github user found in localStorage\n\nTry adding one with the "Github Account" button');
    console.log('github user not found');
  }
}