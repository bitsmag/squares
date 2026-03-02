![alt-text](https://cdn.jsdelivr.net/gh/bitsmag/squares@master/views/assets/img/logo.svg "SQUARES")

SQUARES is a small real‑time multiplayer web game inspired by
[Crash Bash – Pogo Painter](https://www.youtube.com/watch?v=Cq7yoWxOuBU).
Players move around a grid, claim squares with their color, and compete to
control as much of the board as possible before the timer runs out.

The server is built with Node.js, TypeScript, Express, and Socket.IO. The
codebase is organised into a domain / service / transport layering to
keep the game rules independent from HTTP and WebSocket details.

You can try it out here here: <http://squares-env.eba-ahjhmhaf.us-west-2.elasticbeanstalk.com>
## Deploy

### Local (Docker Compose)

Run the game server and bot server locally with:

```bash
docker compose up --build
```

This builds the Node (public) container and Python bot-server container and exposes the game on `http://localhost:3000`.

### AWS ECS / Fargate

The production deployment runs on ECS Fargate as a single task with two containers (Node app + bot server), fronted by an Application Load Balancer.

**AWS environment**

- Region: `eu-central-1`
- ECR repositories:
  - `421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/main`
  - `421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/bot-server`
- ECS cluster: `squares-cluster`
- ECS service: `squares-service`
- Task definition family: `squares-task` (see `ecs-task.json`)
- VPC: `vpc-7361ff18`
- Subnets: `subnet-697f2d02`, `subnet-a2610cef`, `subnet-7392190e`
- Application Load Balancer DNS (public endpoint):
  - `http://squares-alb-1556325320.eu-central-1.elb.amazonaws.com`

**Build and push images**

From the repo root:

```bash
docker build -t squares-main .

cd bot-server
docker build -t squares-bot-server .
```

Log Docker into ECR:

```bash
aws ecr get-login-password --region eu-central-1 \
  | docker login \
    --username AWS \
    --password-stdin 421939066732.dkr.ecr.eu-central-1.amazonaws.com
```

Tag and push images:

```bash
docker tag squares-main:latest \
  421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/main:latest
docker push 421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/main:latest

docker tag squares-bot-server:latest \
  421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/bot-server:latest
docker push 421939066732.dkr.ecr.eu-central-1.amazonaws.com/squares/bot-server:latest
```

**Updating the ECS task & service**

If `ecs-task.json` ever gets changed:

```bash
# Register a new task definition revision
aws ecs register-task-definition \
  --cli-input-json file://ecs-task.json
```

In any case:

```bash
# Roll out the new revision to the running service
aws ecs update-service \
  --cluster squares-cluster \
  --service squares-service \
  --force-new-deployment
```

After the service has finished deploying, the game is available via the [ALB DNS](http://squares-alb-1556325320.eu-central-1.elb.amazonaws.com)
