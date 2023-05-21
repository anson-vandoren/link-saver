PP_PORT=${PP_PORT:-9090}
PP_DATA_DIR=${PP_DATA_DIR:-/etc/pagepouch/data}
PP_VERSION=${PP_VERSION:-latest}

docker stop pagepouch
docker container rm pagepouch
docker pull ghcr.io/anson-vandoren/pagepouch:latest
docker run --name pagepouch -p $PP_PORT:3001 -v $PP_DATA_DIR:/app/data -d ghcr.io/anson-vandoren/pagepouch:$PP_VERSION