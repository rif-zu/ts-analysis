module.exports={
    consumer_key:         'IsGQbsw5LdCjidg6FOC7bwk2j',
    consumer_secret:      'S0C9pSupoBxEWWccviCBbxGwCZvxl0xpG6J2rcFa8aOicYH5Eq',
    access_token:         '934430645060648960-TEu3UU6bFy4O9Ob63HvdsyLOLKAwDNp',
    access_token_secret:  'ER1HvrTtIgffIQW7iYHMg00h4fMaRxW7GBPh2iweooitp',
    encodedTokenCredentials: 'IsGQbsw5LdCjidg6FOC7bwk2j%3AS0C9pSupoBxEWWccviCBbxGwCZvxl0xpG6J2rcFa8aOicYH5Eq',
    // timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    // strictSSL:            true,     // optional - requires SSL certificates to be valid.
     
     rawurlencode: (str)=>{
      return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
    }
  }