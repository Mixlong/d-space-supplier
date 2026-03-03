pipeline {
  agent { label 'windows' }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    CARGO_HOME = "${WORKSPACE}\\.cargo"
    RUSTUP_HOME = "${WORKSPACE}\\.rustup"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Toolchain') {
      steps {
        bat 'node -v'
        bat 'pnpm -v'
        bat 'rustc -V || rustup-init -y'
        bat 'cargo -V'
      }
    }

    stage('Install Dependencies') {
      steps {
        bat 'pnpm install --no-frozen-lockfile'
      }
    }

    stage('Build Windows Installer') {
      steps {
        bat 'pnpm tauri build --target x86_64-pc-windows-msvc'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/**', allowEmptyArchive: true, fingerprint: true
      archiveArtifacts artifacts: 'src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/**', allowEmptyArchive: true, fingerprint: true
    }
  }
}
