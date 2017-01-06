#!/bin/bash

docker build -t pocket_favorites_rss ./
docker run -d --name pocket_favorites_rss --restart always -p 8981:8981 pocket_favorites_rss
