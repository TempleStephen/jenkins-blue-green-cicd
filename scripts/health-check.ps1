stage('Health Check') {
    steps {
        script {
            sh """
            curl --fail http://localhost:5000/health
            """
            echo "Health check passed."
        }
    }
}