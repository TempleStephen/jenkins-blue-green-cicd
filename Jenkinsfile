pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'ROLLBACK',
            defaultValue: false,
            description: 'Rollback traffic to the previous environment'
        )
    }

    environment {
        NGINX_CONTAINER = "blue-green-nginx"
        TARGET_ENV      = "GREEN"
        NGINX_CONFIG    = "/workspace/nginx/default.conf"
    }

    stages {

        stage('Switch Traffic') {
            when {
                expression { return !params.ROLLBACK }
            }

            steps {
                script {
                    echo "========== SWITCH TRAFFIC =========="

                    def targetBackend = env.TARGET_ENV == "GREEN" ? "green_backend" : "blue_backend"

                    sh """
                        set -e

                        echo "Switching traffic to ${targetBackend}"

                        sed 's|proxy_pass http://blue_backend;|proxy_pass http://${targetBackend};|g' \
                        ${NGINX_CONFIG} > /tmp/default.conf

                        cat /tmp/default.conf > ${NGINX_CONFIG}

                        echo "Testing Nginx configuration..."
                        docker exec ${NGINX_CONTAINER} nginx -t

                        echo "Reloading Nginx..."
                        docker exec ${NGINX_CONTAINER} nginx -s reload

                        echo "Verifying active configuration..."
                        docker exec ${NGINX_CONTAINER} grep -q \
                        "proxy_pass http://${targetBackend};" \
                        /etc/nginx/conf.d/default.conf

                        echo "Traffic switch verified successfully."
                    """

                    echo "Verified: Nginx is routing traffic to ${targetBackend}"
                }
            }
        }

        stage('Rollback') {
            when {
                expression { return params.ROLLBACK }
            }

            steps {
                script {
                    echo "========== ROLLBACK =========="

                    sh """
                        set -e

                        ACTIVE_BACKEND=\$(docker exec ${NGINX_CONTAINER} sh -c \
                        "grep proxy_pass /etc/nginx/conf.d/default.conf")

                        if echo "\$ACTIVE_BACKEND" | grep green_backend >/dev/null; then
                            TARGET=blue_backend
                        else
                            TARGET=green_backend
                        fi

                        echo "Rolling traffic back to \$TARGET"

                        sed "s|proxy_pass http://.*_backend;|proxy_pass http://\$TARGET;|g" \
                        ${NGINX_CONFIG} > /tmp/default.conf

                        cat /tmp/default.conf > ${NGINX_CONFIG}

                        echo "Testing rollback configuration..."
                        docker exec ${NGINX_CONTAINER} nginx -t

                        echo "Reloading Nginx..."
                        docker exec ${NGINX_CONTAINER} nginx -s reload

                        echo "Verifying rollback..."
                        docker exec ${NGINX_CONTAINER} grep -q \
                        "proxy_pass http://\$TARGET;" \
                        /etc/nginx/conf.d/default.conf

                        echo "Rollback completed successfully."
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
            echo "Traffic switch or rollback failed."
        }

        always {
            sh """
                echo "Current active backend:"
                docker exec ${NGINX_CONTAINER} grep proxy_pass /etc/nginx/conf.d/default.conf
            """
        }
    }
}