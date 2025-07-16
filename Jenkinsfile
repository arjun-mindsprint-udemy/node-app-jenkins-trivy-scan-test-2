pipeline {
    agent {
        label 'windows-arjun'
    }

    environment {
        DOCKERHUB_USERNAME = credentials('DOCKERHUB_USERNAME_ARJUN')
        DOCKERHUB_TOKEN = credentials('DOCKERHUB_TOKEN_ARJUN')
        COMMIT_ID = "${env.GIT_COMMIT.take(6)}"
        APP_NAME = 'node-app-jenkins-trivy-scan-test-2'
        APP_ENV = 'dev'
        SONAR_TOKEN = credentials('SONAR_TOKEN_ARJUN')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Set Commit ID') {
            steps {
                script {
                    env.COMMIT_ID = env.GIT_COMMIT.take(6)
                    echo "COMMIT_ID set to: ${env.COMMIT_ID}"
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    bat 'sonar-scanner'
                }
            }

        }

        stage('Login to Docker Hub') {
            steps {
                bat '''
                    echo %DOCKERHUB_TOKEN% | docker login --username %DOCKERHUB_USERNAME% --password-stdin
                '''
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                script {
                    bat '''
                        echo Running Trivy Filesystem Scan...
                        trivy fs .
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def app_name = env.APP_NAME
                    bat """
                        docker build -t arjun150800/${app_name}:${env.COMMIT_ID} .
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    def app_name = env.APP_NAME
                    bat """
                        docker push arjun150800/${app_name}:${env.COMMIT_ID}
                    """
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                script {
                    bat '''
                        echo Scanning built Docker image with Trivy...
                        trivy image arjun150800/%APP_NAME%:%COMMIT_ID%
                    '''
                }
            }
        }

        stage('Deploy with Helm') {
            steps {
                script {
                    def commitId = env.COMMIT_ID
                    def app_name = env.APP_NAME
                    def app_env = env.APP_ENV
                    bat """
                        wsl helm upgrade --install ${app_name} ./charts/${app_name} -n ${app_env} --create-namespace --set image.tag=${commitId}
                    """
                }
            }
        }

        stage ('Post-deployment Health Check') {
            steps {
                script {
                    bat'''
                        echo Waiting for pod to be ready...
                        timeout /t 10
                        echo Checking /health endpoint
                        curl http://localhost:8080/health
                    '''
                }
            }
        }
    }

    post {
        always {
            bat 'docker logout'
        }
    }
}
