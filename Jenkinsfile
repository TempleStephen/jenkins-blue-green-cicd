pipeline {
    agent any

    environment {
        NGINX_CONTAINER = "blue-green-nginx"
        TARGET_ENV      = "GREEN"
        NGINX_CONFIG    = "/workspace/nginx/default.conf"
    }

    stages {
        stage('Switch Traffic') {
            steps {
                script {
                    echo "========== SWITCH TRAFFIC =========="

                    def targetBackend = env.TARGET_ENV == "GREEN" ? "green_backend" : "blue_backend"

                    sh """
                        set -e

                        echo "Switching traffic to ${targetBackend}"

                        sed -i 's|proxy_pass http://blue_backend;|proxy_pass http://${targetBackend};|g' ${NGINX_CONFIG}

                        echo "Testing Nginx configuration..."
                        docker exec ${NGINX_CONTAINER} nginx -t

                        echo "Reloading Nginx..."
                        docker exec ${NGINX_CONTAINER} nginx -s reload

                        echo "Verifying active configuration..."
                        docker exec ${NGINX_CONTAINER} grep -q "proxy_pass http://${targetBackend};" /etc/nginx/conf.d/default.conf

                        echo "Traffic switch verified successfully."
                    """

                    echo "Verified: Nginx is routing traffic to ${targetBackend}"

                    sh """
                        docker exec ${NGINX_CONTAINER} grep "proxy_pass" /etc/nginx/conf.d/default.conf
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Blue-Green deployment completed successfully."
        }

        failure {
            echo "Traffic switch failed."
        }
    }
}