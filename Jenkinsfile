```groovy
pipeline {
    agent any

    environment {
        PROJECT_DIR = 'C:\\jenkins-blue-green-cicd'
        BLUE_URL    = 'http://localhost:5001'
        GREEN_URL   = 'http://localhost:5002'
        LIVE_URL    = 'http://localhost:5000'
    }

    stages {

        stage('Verify Environment') {
            steps {
                echo 'Checking Docker and project environment...'

                bat 'docker --version'
                bat 'docker compose version'
                bat 'cd /d "%PROJECT_DIR%" && docker compose config'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Blue and Green Docker images...'

                bat '''
                    cd /d "%PROJECT_DIR%"
                    docker compose build
                '''
            }
        }

        stage('Start Blue-Green Environment') {
            steps {
                echo 'Starting Blue, Green and Nginx...'

                bat '''
                    cd /d "%PROJECT_DIR%"
                    docker compose up -d
                '''
            }
        }

        stage('Verify Containers') {
            steps {
                bat '''
                    cd /d "%PROJECT_DIR%"
                    docker compose ps
                '''
            }
        }

        stage('Health Check GREEN') {
            steps {
                powershell '''
                    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

                    & "$env:PROJECT_DIR\\scripts\\health-check.ps1"
                '''
            }
        }

        stage('Deploy GREEN') {
            steps {
                powershell '''
                    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

                    & "$env:PROJECT_DIR\\scripts\\deploy-green.ps1"
                '''
            }
        }

        stage('Verify Live Traffic') {
            steps {
                powershell '''
                    $response = Invoke-WebRequest -UseBasicParsing "$env:LIVE_URL"

                    if ($response.StatusCode -ne 200) {
                        throw "Live traffic verification failed."
                    }

                    Write-Host "Live traffic verification PASSED."
                    Write-Host "HTTP Status: $($response.StatusCode)"
                '''
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo 'BLUE-GREEN DEPLOYMENT SUCCESSFUL'
            echo 'GREEN is now serving live traffic.'
            echo '=========================================='
        }

        failure {
            echo '=========================================='
            echo 'PIPELINE FAILED'
            echo 'Attempting rollback to BLUE...'
            echo '=========================================='

            powershell '''
                Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

                if (Test-Path "$env:PROJECT_DIR\\scripts\\rollback.ps1") {
                    & "$env:PROJECT_DIR\\scripts\\rollback.ps1"
                }
            '''
        }
    }
}
```