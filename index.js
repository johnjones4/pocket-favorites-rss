const express = require('express');
const config = require('./config');
const GetPocket = require('node-getpocket');
const RSS = require('rss');

const redirect = config.urlRoot + '/callback';

var accessToken;
var requestToken;

const app = express();

app.get('/',function(req,res,next) {
  if (accessToken) {
    const pocket = new GetPocket({
      'consumer_key': config.pocket.consumerKey,
      'access_token': accessToken
    });
    const params1 = {
      'favorite': 1
    }
    pocket.get(params1,function(err,resp) {
      if (err) {
        next(err);
      } else if (resp && resp.list) {
        const rssFeed = new RSS({
          'title': 'Pocket Favorites',
          'pubDate': new Date()
        });
        for(var itemId in resp.list) {
          const item = resp.list[itemId];
          rssFeed.item({
            'title': item.given_title,
            'description': item.excerpt,
            'url': item.given_url,
            'date': new Date(parseInt(item.time_added) * 1000)
          });
        }
        res.setHeader('Content-type','application/xml');
        res.send(rssFeed.xml());
      }
    });
  } else {
    const params2 = {
      'redirect_uri': redirect
    };
    const pocket1 = new GetPocket({
      'redirect_uri': redirect,
      'consumer_key': config.pocket.consumerKey
    });
    pocket1.getRequestToken(params2, function(err, resp, body) {
      if (err) {
        next(err);
      } else {
        var json = JSON.parse(body);
        requestToken = json.code;
        var url = pocket1.getAuthorizeURL({
          'consumer_key': config.pocket.consumerKey,
          'request_token': requestToken,
          'redirect_uri': redirect
        });
        res.redirect(url);
      }
    });
  }
});

app.get('/callback',function(req,res,next) {
  if (requestToken) {
    const params3 = {
      'request_token': requestToken
    };
    const pocket2 = new GetPocket({
      'redirect_uri': redirect,
      'consumer_key': config.pocket.consumerKey
    });
    pocket2.getAccessToken(params3, function(err, resp, body) {
      if (err) {
        next(err);
      } else {
        var json = JSON.parse(body);
        accessToken = json.access_token;
        res.redirect('/');
      }
    });
  } else {
    res.send(400);
  }
});

app.listen(config.express.port,function() {
  console.log('Running');
});
