import fetch from "node-fetch";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

export default async function handler(req, res) {
  let path = "https://api.publisher.tonic.com/privileged/v3/reports/tracking?columns=date,clicks,campaign_id,campaign_name,revenueUsd,subid1,subid2,keyword,network,site,adtitle,timestamp,device&output=json";
    let start = req.query.from;
    let end = req.query.to;
    let date = req.query.date;

    path = path + "&from=" + start + "&to=" + end;
    if(date!=="no"){
        path = path + "&date=" + date;
    }
    
    let token = await generateToken();
    // -- get campaign list
    let campaignList = await call('get', path, token);

    // res.send(campaignList);
  res.status(200).json(campaignList)
}

// create OAuth Object
const oauth = OAuth({
  consumer: {
      key: '39535789572405466851',
      secret: 'bb165c810c1349e61dfbd52b9fe9c47bffce76d7',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
      return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
  },
})

const call = async function(method, url, token) {

  let reqData = {
      url: url,
      method: method
  };

  let headers = oauth.toHeader(oauth.authorize(reqData, token));
  headers['Content-Type'] = "application/json";

  try {
      const response = await fetch(url, {
          method: method,
          headers: headers
      })

      return response.json();
  } catch(err) {
      throw err;
  }
}

const generateToken = async () => {
  // token storage
  let token = {
      key: null,
      secret: null,
      verifier: null,
  }

  // -- get request token
  const responseRT = await call('post', 'https://api.publisher.tonic.com/oauth/token/request');

  // -- store token
  token.key = responseRT.oauth_token;
  token.secret = responseRT.oauth_token_secret;

  // -- get verifier
  const responseVT =await call('post', 'https://api.publisher.tonic.com/oauth/token/verify', token);

  // -- store verifier
  token.verifier = responseVT.oauth_verifier;

  // -- get access token
  const responseAT = await call('post', 'https://api.publisher.tonic.com/oauth/token/access?oauth_verifier=' + token.verifier, token);

  // -- store access token
  token.key = responseAT.oauth_token;
  token.secret = responseAT.oauth_token_secret;

  return token;
}