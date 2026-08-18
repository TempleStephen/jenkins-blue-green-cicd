pipeline {
    agent any

    triggers {
        githubPush()   // fires when GitHub sends a push webhook to this Jenkins job
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')      // Jenkins credential ID
        IMAGE_NAME             = 'templestephen/bluegreen-dashboard'
        IMAGE_TAG               = "${env.BUILD_NUMBER}"
        EC2_HOST                = credentials('ec2-host')            // e.g. ec2-user@x.x.x.x, stored as Jenkins secret text
        EC2_SSH_KEY              = 'ec2-ssh-key'                      // Jenkins SSH credential ID
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
            }
        }

        stage('Test') {
            steps {
                // Spin the image up in isolation and hit the health endpoint
                // before it ever gets near the deploy stage.
                sh '''
                    docker run -d --name test-container -p 8099:80 $IMAGE_NAME:$IMAGE_TAG
                    sleep 3
                    curl -f http://localhost:8099/health
                    docker rm -f test-container
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                    echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin
                    docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest
                    docker push $IMAGE_NAME:$IMAGE_TAG
                    docker push $IMAGE_NAME:latest
                '''
            }
        }

        stage('Deploy to Standby (Blue-Green)') {
            steps {
                sshagent(credentials: [EC2_SSH_KEY]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $EC2_HOST \
                          "IMAGE=$IMAGE_NAME:$IMAGE_TAG bash -s" < deploy/deploy.sh
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployed $IMAGE_NAME:$IMAGE_TAG — cutover handled by deploy/deploy.sh on the EC2 host."
        }
        failure {
            echo "Pipeline failed — standby environment was not touched, live traffic is unaffected."
        }
        always {
            sh 'docker logout || true'
        }
    }
}
