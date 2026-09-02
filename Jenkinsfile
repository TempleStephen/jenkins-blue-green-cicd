pipeline {
    agent any

    environment {
        NGINX_CONTAINER = "blue-green-nginx"
        TARGET_ENV = "GREEN"
    }

    stages {
        stage('Switch Traffic') {
            steps {
                script {

                    echo "========== SWITCH TRAFFIC =========="

                    // Use the actual Docker container names
                    def targetBackend = (env.TARGET_ENV == "GREEN") ? "green-app" : "blue-app"

                    sh """
                        docker exec ${NGINX_CONTAINER} sh -c '
                            sed "s|proxy_pass http://blue-app;|proxy_pass http://${targetBackend};|g;
                                 s|proxy_pass http://green-app;|proxy_pass http://${targetBackend};|g" \
                            /etc/nginx/conf.d/default.conf > /tmp/default.conf

                            cp /tmp/default.conf /etc/nginx/conf.d/default.conf

                            nginx -t
                            nginx -s reload
                        '
                    """

                    echo "Traffic switched successfully to ${env.TARGET_ENV}."

                    sh """
                        docker exec ${NGINX_CONTAINER} grep "proxy_pass" /etc/nginx/conf.d/default.conf
                    """
                }
            }
        }
    }
}