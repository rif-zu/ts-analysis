const  axios =require('axios');
const qs =require('query-string');
const keys = require('./keys');

module.exports= {
   obtainAccessToken:()=>{
    const options = {
      url: 'https://api.twitter.com/oauth2/token',
      method: 'POST',
      headers: {
        Authorization: `Basic `+keys.encodedTokenCredentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        grant_type: 'client_credentials',
      }),
    };

    return axios(options).then(res => res.data.access_token);
  },

   searchTweets:(params)=>{
    const options = {
      url: `/tweets?${qs.stringify(params)}`,
      method: 'GET',
    };

    return axios(options).then(res => res.data.items);
  }
} 
