#!/bin/bash

docker build -t pocket_favorites_rss ./
docker run -d --name pocket_favorites_rss --restart always pocket_favorites_rss
