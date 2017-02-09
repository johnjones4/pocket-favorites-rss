const express = require('express');
const config = require('./config');
const GetPocket = require('node-getpocket');
const RSS = require('rss');

const redirect = config.urlRoot + '/callback';
const pocket = new GetPocket({
  'redirect_uri': redirect,
  'consumer_key': config.pocket.consumerKey
});

var accessToken;
var requestToken;

const app = express();

app.get('/',function(req,res,next) {
  if (accessToken) {
    const pocket = new GetPocket({
      'consumer_key': config.pocket.consumerKey,
      'access_token': accessToken
    });
    const params = {
      'favorite': 1
    }
    pocket.get(params,function(err,resp) {
      if (err) {
        next(err);
      } else if (resp && resp.list) {
        const rssFeed = new RSS({
          'title': 'Pocket Favorites',
          'pubDate': new Date()
        });
        const items = [];
        for(var itemId in resp.list) {
          const item = resp.list[itemId];
          items.push({
            'title': item.given_title,
            'description': item.excerpt,
            'url': item.given_url,
            'date': new Date(parseInt(item.time_added) * 1000)
          });
        }
        items.sort(function(a,b) {
          return b.date.getTime() - a.date.getTime();
        });
        items.forEach(function(item) {
          rssFeed.item(item);
        });
        res.setHeader('Content-type','application/xml');
        res.send(rssFeed.xml());
      }
    });
  } else {
    const params = {
      'redirect_uri': redirect
    };
    pocket.getRequestToken(params, function(err, resp, body) {
      if (err) {
        next(err);
      } else {
        var json = JSON.parse(body);
        requestToken = json.code;
        var url = pocket.getAuthorizeURL({
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
    const params = {
      'request_token': requestToken
    };
    pocket.getAccessToken(params, function(err, resp, body) {
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
