pipeline {
    agent any

    environment {
        PROJECT_DIR = "/var/jenkins_home/workspace/jenkins-blue-green-cicd"
        BLUE_PORT = "5001"
        GREEN_PORT = "5002"
        LIVE_PORT = "5000"
    }

    stages {

        stage('Checkout Source') {
            steps {
                echo "Cloning GitHub repository..."
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                sh 'docker --version'
                sh 'docker compose version'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Start Blue Environment') {
            steps {
                sh 'docker compose up -d blue'
            }
        }

        stage('Deploy Green Environment') {
            steps {
                sh 'docker compose up -d green'
            }
        }

        stage('Health Check Green') {
            steps {
                sh 'curl -f http://green-app || exit 1'
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                sh '''
                docker exec blue-green-nginx sh -c \
                "sed -i 's/server blue-app:80;/server green-app:80;/' /etc/nginx/conf.d/default.conf"

                docker exec blue-green-nginx nginx -s reload
                '''
            }
        }

        stage('Verify Live Environment') {
            steps {
                sh 'curl -f http://blue-green-nginx || exit 1'
            }
        }

    }

    post {

        success {
            echo 'Deployment Successful. GREEN is LIVE.'
        }

        failure {
            echo 'Deployment Failed.'
            sh '''
            docker exec blue-green-nginx sh -c \
            "sed -i 's/server green-app:80;/server blue-app:80;/' /etc/nginx/conf.d/default.conf"

            docker exec blue-green-nginx nginx -s reload
            '''
        }

        always {
            echo 'Pipeline Finished.'
        }
    }
}