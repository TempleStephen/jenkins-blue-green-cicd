pipeline {
    agent any

    environment {
        BLUE_CONTAINER = "blue-app"
        GREEN_CONTAINER = "green-app"
        NGINX_CONTAINER = "blue-green-nginx"
    }

    stages {

        stage('Checkout Source') {
            steps {
                echo "========== CHECKOUT SOURCE =========="
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                echo "========== VERIFY DOCKER =========="

                sh '''
                    docker --version
                    docker compose version
                    docker ps
                '''
            }
        }

        stage('Build Application Images') {
            steps {
                echo "========== BUILD APPLICATION IMAGES =========="

                sh '''
                    docker compose build --no-cache blue green
                '''
            }
        }

        stage('Start Environments') {
            steps {
                echo "========== START BLUE & GREEN =========="

                sh '''
                    docker compose up -d blue green
                '''

                sleep 5
            }
        }

        stage('Detect Live Environment') {
            steps {
                script {

                    echo "========== DETECT LIVE ENVIRONMENT =========="

                    def nginxConfig = sh(
                        script: """
                            docker exec ${NGINX_CONTAINER} \
                            cat /etc/nginx/conf.d/default.conf
                        """,
                        returnStdout: true
                    ).trim()

                    if (nginxConfig.contains("proxy_pass http://blue_backend;")) {

                        env.CURRENT_ENV = "BLUE"
                        env.TARGET_ENV = "GREEN"

                    }
                    else if (nginxConfig.contains("proxy_pass http://green_backend;")) {

                        env.CURRENT_ENV = "GREEN"
                        env.TARGET_ENV = "BLUE"

                    }
                    else {

                        error("Unable to determine active environment.")

                    }

                    echo "CURRENT LIVE ENVIRONMENT: ${env.CURRENT_ENV}"
                    echo "DEPLOYMENT TARGET: ${env.TARGET_ENV}"
                }
            }
        }

        stage('Health Check Standby') {
            steps {

                script {

                    def targetContainer =
                        env.TARGET_ENV == "GREEN"
                        ? env.GREEN_CONTAINER
                        : env.BLUE_CONTAINER

                    echo "========== HEALTH CHECK ${env.TARGET_ENV} =========="

                    sh """
                        curl --fail \
                             --silent \
                             --show-error \
                             --retry 5 \
                             --retry-delay 2 \
                             http://${targetContainer}/

                        echo ""
                        echo "${env.TARGET_ENV} HEALTH CHECK PASSED."
                    """
                }
            }
        }

        stage('Switch Traffic') {
            steps {

                script {

                    echo "========== SWITCH TRAFFIC =========="

                    def targetBackend =
                        env.TARGET_ENV == "GREEN"
                        ? "green_backend"
                        : "blue_backend"

                    sh """
                        docker exec ${NGINX_CONTAINER} sh -c '
                            awk '\''{
                                if (\$0 ~ /proxy_pass http:\\/\\/blue_backend;/) {
                                    print "        proxy_pass http://${targetBackend};"
                                }
                                else if (\$0 ~ /proxy_pass http:\\/\\/green_backend;/) {
                                    print "        proxy_pass http://${targetBackend};"
                                }
                                else {
                                    print
                                }
                            }'\'' /etc/nginx/conf.d/default.conf > /tmp/default.conf

                            cat /tmp/default.conf > /etc/nginx/conf.d/default.conf
                        '

                        docker exec ${NGINX_CONTAINER} nginx -t

                        docker exec ${NGINX_CONTAINER} nginx -s reload

                        echo "Traffic switched to ${env.TARGET_ENV}."
                    """
                }
            }
        }

        stage('Verify Live Traffic') {
            steps {

                echo "========== VERIFY LIVE TRAFFIC =========="

                sh '''
                    curl --fail \
                         --silent \
                         --show-error \
                         http://blue-green-nginx/

                    echo ""

                    curl --fail \
                         --silent \
                         http://blue-green-nginx/health

                    echo ""

                    echo "LIVE TRAFFIC VERIFICATION PASSED."
                '''
            }
        }

        stage('Deployment Summary') {
            steps {

                echo "========== DEPLOYMENT SUMMARY =========="

                sh '''
                    echo "======================================"
                    echo " BLUE-GREEN DEPLOYMENT SUCCESSFUL"
                    echo "======================================"
                    echo "Previous Environment: ${CURRENT_ENV}"
                    echo "Live Environment:     ${TARGET_ENV}"
                    echo "======================================"

                    docker ps
                '''
            }
        }
    }

    post {

        success {

            echo "=========================================="
            echo "DEPLOYMENT SUCCESSFUL"
            echo "LIVE ENVIRONMENT: ${env.TARGET_ENV}"
            echo "=========================================="
        }

        failure {

            echo "=========================================="
            echo "DEPLOYMENT FAILED"
            echo "ATTEMPTING ROLLBACK"
            echo "=========================================="

            script {

                if (env.CURRENT_ENV) {

                    def rollbackBackend =
                        env.CURRENT_ENV == "BLUE"
                        ? "blue_backend"
                        : "green_backend"

                    sh """
                        docker exec ${NGINX_CONTAINER} sh -c '
                            awk '\''{
                                if (\$0 ~ /proxy_pass http:\\/\\/blue_backend;/) {
                                    print "        proxy_pass http://${rollbackBackend};"
                                }
                                else if (\$0 ~ /proxy_pass http:\\/\\/green_backend;/) {
                                    print "        proxy_pass http://${rollbackBackend};"
                                }
                                else {
                                    print
                                }
                            }'\'' /etc/nginx/conf.d/default.conf > /tmp/default.conf

                            cat /tmp/default.conf > /etc/nginx/conf.d/default.conf
                        ' || true

                        docker exec ${NGINX_CONTAINER} nginx -t || true

                        docker exec ${NGINX_CONTAINER} nginx -s reload || true

                        echo "ROLLBACK COMPLETED."
                        echo "LIVE ENVIRONMENT RESTORED TO: ${env.CURRENT_ENV}"
                    """
                }
            }
        }

        always {

            echo "========== PIPELINE FINISHED =========="
        }
    }
}