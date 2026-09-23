# 🚀 Blue-Green CI/CD Deployment with Jenkins, Docker & Nginx

<div align="center">

### Zero-Downtime Deployments • Automated Traffic Switching • Health Checks • Instant Rollback

*A production-style Blue-Green Deployment pipeline built with Jenkins, Docker Compose, Nginx, and GitHub.*

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge\&logo=docker\&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge\&logo=jenkins\&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge\&logo=nginx\&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI/CD-Automation-orange?style=for-the-badge)

</div>

---

## 📌 Project Overview

This project demonstrates a **Blue-Green Deployment strategy** using **Jenkins**, **Docker Compose**, and **Nginx** to achieve **zero-downtime application releases**.

Instead of deploying directly to production, Jenkins deploys a new application version to a **standby (Green)** environment, validates it with health checks, and only then switches production traffic from **Blue** to **Green**.

If anything goes wrong, traffic can be switched back instantly without rebuilding or restarting the application.

---

## 🏗️ Architecture Diagram

This architecture demonstrates a complete Blue-Green deployment workflow using Jenkins, Docker, Nginx, and two isolated application environments.

<p align="center">
  <img src="./screenshots/architecture-diagram.png"
       alt="Architecture Diagram"
       width="100%">
</p>

---

## 🎯 Project Architecture

```text
                     GitHub Repository
                           │
                Webhook / Manual Trigger
                           │
                    Jenkins CI/CD Pipeline
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     Build Blue Image                  Build Green Image
          │                                 │
     Blue Container                    Green Container
      (v1.0.0)                          (v1.1.0)
      Port 5001                         Port 5002
          │                                 │
          └──────────────┬──────────────────┘
                         │
                 Nginx Reverse Proxy
              (Traffic Switch Controller)
                    Port 5000
                         │
                    User / Browser
```

---

# ✨ Features

* ✅ Blue-Green Deployment strategy.
* ✅ Zero-downtime traffic switching.
* ✅ Jenkins Declarative Pipeline.
* ✅ Docker Compose orchestration.
* ✅ Nginx reverse proxy load balancing.
* ✅ Automated health verification.
* ✅ Dynamic environment version detection.
* ✅ Instant rollback capability.
* ✅ GitHub source-controlled deployment pipeline.

---

# 🛠️ Tech Stack

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| **Jenkins**             | CI/CD automation pipeline      |
| **Docker**              | Containerization               |
| **Docker Compose**      | Multi-container orchestration  |
| **Nginx**               | Reverse proxy & traffic switch |
| **GitHub**              | Source control                 |
| **PowerShell**          | Deployment & rollback scripts  |
| **HTML/CSS/JavaScript** | Demo web application           |

---

# 📁 Project Structure

```bash
jenkins-blue-green-cicd/
│
├── app/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.json
│
├── nginx/
│   └── default.conf
│
├── scripts/
│   ├── deploy-green.ps1
│   ├── health-check.ps1
│   └── rollback.ps1
│
├── screenshots/
│   ├── architecture-diagram.png
│   ├── jenkins-success.png
│   ├── docker-compose-ps.png
│   ├── dashboard-blue.png
│   ├── dashboard-green.png
│   └── rollback.png
│
├── Dockerfile
├── Dockerfile.jenkins
├── docker-compose.yml
├── Jenkinsfile
└── README.md
```

---

# ⚙️ Docker Compose Services

The project runs four containers connected through a shared Docker network.

| Service       | Port   | Description                             |
| ------------- | ------ | --------------------------------------- |
| **Blue App**  | `5001` | Live production environment (v1.0.0)    |
| **Green App** | `5002` | Standby deployment environment (v1.1.0) |
| **Nginx**     | `5000` | Reverse proxy & traffic switch          |
| **Jenkins**   | `8080` | CI/CD server                            |

Network:

```yaml
bluegreen-network
```

---

# 🔄 Blue-Green Deployment Workflow

## Step 1 — Developer Pushes Code

```text
Developer
   │
   ▼
GitHub Repository
```

Jenkins detects a push or manual trigger.

---

## Step 2 — Jenkins Builds Images

Jenkins checks out the latest code and builds two Docker images.

```bash
docker compose build --no-cache blue green
```

Blue image contains:

```json
{
  "environment":"BLUE",
  "version":"v1.0.0"
}
```

Green image contains:

```json
{
  "environment":"GREEN",
  "version":"v1.1.0"
}
```

---

## Step 3 — Deploy Green

Green is deployed while Blue continues serving users.

```bash
docker compose up -d green
```

Production traffic remains on Blue.

---

## Step 4 — Health Check

Jenkins validates Green before switching traffic.

```bash
curl http://green-app/health
```

Expected response:

```text
Healthy
```

If the health check fails, deployment stops.

---

## Step 5 — Switch Traffic

Jenkins updates Nginx.

Before deployment:

```nginx
proxy_pass http://blue_backend;
```

After deployment:

```nginx
proxy_pass http://green_backend;
```

Reload Nginx.

```bash
nginx -t
nginx -s reload
```

Traffic changes instantly without restarting containers.

---

## Step 6 — Verification

Jenkins verifies the active backend.

```bash
docker exec blue-green-nginx grep proxy_pass /etc/nginx/conf.d/default.conf
```

Expected:

```text
proxy_pass http://green_backend;
```

---

## Step 7 — Rollback

Rollback simply points traffic back to Blue.

```nginx
proxy_pass http://blue_backend;
```

Users immediately receive the previous stable version.

---

# ⚡ Jenkins Pipeline

The deployment pipeline automates traffic switching.

```groovy
pipeline {
    agent any

    environment {
        NGINX_CONTAINER = "blue-green-nginx"
        TARGET_ENV = "GREEN"
        NGINX_CONFIG = "/workspace/nginx/default.conf"
    }

    stages {

        stage('Switch Traffic') {

            steps {

                script {

                    def targetBackend = env.TARGET_ENV == "GREEN" ?
                        "green_backend" : "blue_backend"

                    sh """
                        set -e

                        sed 's|proxy_pass http://blue_backend;|proxy_pass http://${targetBackend};|g' \
                        ${NGINX_CONFIG} > /tmp/default.conf

                        cat /tmp/default.conf | docker exec -i ${NGINX_CONTAINER} \
                        tee /etc/nginx/conf.d/default.conf >/dev/null

                        docker exec ${NGINX_CONTAINER} nginx -t
                        docker exec ${NGINX_CONTAINER} nginx -s reload

                        docker exec ${NGINX_CONTAINER} grep -q \
                        "proxy_pass http://${targetBackend};" \
                        /etc/nginx/conf.d/default.conf
                    """

                    echo "Traffic switched successfully."

                }

            }

        }

    }

}
```

---

# 🌐 Nginx Reverse Proxy Configuration

### Upstream Servers

```nginx
upstream blue_backend {
    server blue-app:80;
}

upstream green_backend {
    server green-app:80;
}
```

### Load Balancer

```nginx
server {

    listen 80;

    location / {

        proxy_pass http://blue_backend;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

    }

    location /health {

        access_log off;
        default_type text/plain;
        return 200 "Nginx is healthy\n";

    }

}
```

Only the `proxy_pass` line changes during deployment.

---

# 🩺 Health Check

Verify Nginx health.

```bash
curl http://localhost:5000/health
```

Output:

```text
Nginx is healthy
```

Verify Green application.

```bash
curl http://localhost:5002/config.json
```

Output:

```json
{
  "environment":"GREEN",
  "version":"v1.1.0"
}
```

---

# 🧠 Dynamic Frontend Detection

Instead of hardcoded values, the dashboard fetches its environment from `config.json`.

```javascript
const response = await fetch("/config.json");
const data = await response.json();

document.getElementById("environment-small").textContent = data.environment;
document.getElementById("version").textContent = data.version;
```

The UI always displays whichever environment Nginx is routing to.

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/TempleStephen/jenkins-blue-green-cicd.git

cd jenkins-blue-green-cicd
```

---

## Build Images

```bash
docker compose build --no-cache blue green
```

---

## Start Containers

```bash
docker compose up -d
```

---

## Verify Containers

```bash
docker compose ps
```

Expected containers:

```text
blue-app
green-app
blue-green-nginx
jenkins-server
```

---

# 🧪 Testing

### Blue Environment

```bash
curl http://localhost:5001/config.json
```

Returns

```json
{
  "environment":"BLUE",
  "version":"v1.0.0"
}
```

---

### Green Environment

```bash
curl http://localhost:5002/config.json
```

Returns

```json
{
  "environment":"GREEN",
  "version":"v1.1.0"
}
```

---

### Active Production Environment

```bash
curl http://localhost:5000/config.json
```

Before deployment:

```json
{
  "environment":"BLUE",
  "version":"v1.0.0"
}
```

After deployment:

```json
{
  "environment":"GREEN",
  "version":"v1.1.0"
}
```

---

# 📸 Screenshots

Add these screenshots after completing the project.

| Screenshot                 | Description                    |
| -------------------------- | ------------------------------ |
| `architecture-diagram.png` | Blue-Green CI/CD architecture  |
| `jenkins-success.png`      | Successful Jenkins pipeline    |
| `docker-compose-ps.png`    | Running Docker containers      |
| `dashboard-blue.png`       | Dashboard showing Blue active  |
| `dashboard-green.png`      | Dashboard showing Green active |
| `rollback.png`             | Rollback demonstration         |

Example:

```md
## Jenkins Pipeline Success

![Pipeline](./screenshots/jenkins-success.png)
```

---

# 📈 Deployment Flow

| Stage              | Action                             |
| ------------------ | ---------------------------------- |
| **Checkout**       | Pull latest GitHub repository      |
| **Build**          | Build Blue & Green Docker images   |
| **Deploy**         | Deploy Green container             |
| **Health Check**   | Validate Green application         |
| **Switch Traffic** | Update Nginx configuration         |
| **Reload Nginx**   | Apply new routing without downtime |
| **Verification**   | Confirm active backend             |
| **Rollback**       | Switch traffic back if required    |

---

# 🎓 DevOps Skills Demonstrated

* Jenkins Declarative Pipelines
* Docker Image Versioning
* Docker Compose Networking
* Nginx Reverse Proxy Configuration
* Blue-Green Deployment Strategy
* Zero-Downtime Releases
* Automated Health Checks
* Rollback Automation
* GitHub CI/CD Workflow
* Linux Command-Line Automation

---

# 🔮 Future Improvements

* [ ] Deploy the application on AWS EC2.
* [ ] Store Docker images in Amazon ECR.
* [ ] Deploy using Amazon ECS / EKS.
* [ ] Trigger Jenkins automatically with GitHub Webhooks.
* [ ] Add Prometheus & Grafana monitoring.
* [ ] Add Slack deployment notifications.
* [ ] Implement automatic rollback on failed health checks.

---

# 👨‍💻 About This Project

This project was built as part of my hands-on **Cloud & DevOps Engineering Portfolio** to demonstrate real-world CI/CD practices using Docker, Jenkins, GitHub, and Nginx.

It focuses on **production deployment automation**, **high availability**, and **zero-downtime releases**—concepts commonly used in modern DevOps environments.

---

# 👤 Author

## Temple Stephen

**AWS Cloud & DevOps Engineer**

I build practical cloud infrastructure and CI/CD automation projects using AWS, Docker, Jenkins, Linux, and Infrastructure as Code.

### Connect With Me

* **GitHub:** https://github.com/TempleStephen
* **Upwork Portfolio:** https://tinyurl.com/6vwve75h

---

<div align="center">

### ⭐ If you found this project helpful, consider giving it a Star on GitHub!

**Blue-Green Deployment • Jenkins • Docker • Nginx • CI/CD**

</div>
