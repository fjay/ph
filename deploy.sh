cd /mnt/data/docker/ph || exit

git pull

docker-compose build

docker-compose up -d
