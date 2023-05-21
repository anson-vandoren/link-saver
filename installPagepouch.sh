docker stop pagepouch
docker container rm pagepouch
docker pull ghcr.io/anson-vandoren/pagepouch:latest
docker run --name pagepouch -p 9090:3001 -v /etc/pagepouch/data:/app/data -d ghcr.io/anson-vandoren/pagepouch:latest