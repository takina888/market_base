plugins {
    id("com.android.application")
}

val releaseStoreFile = providers.gradleProperty("MARKET_BASE_STORE_FILE")
val releaseStorePassword = providers.gradleProperty("MARKET_BASE_STORE_PASSWORD")
val releaseKeyAlias = providers.gradleProperty("MARKET_BASE_KEY_ALIAS")
val releaseKeyPassword = providers.gradleProperty("MARKET_BASE_KEY_PASSWORD")
val hasReleaseSigning = listOf(
    releaseStoreFile,
    releaseStorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
).all { it.isPresent }

android {
    namespace = "io.github.takina888.marketbase"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "io.github.takina888.marketbase"
        minSdk = 23
        targetSdk = 36
        versionCode = 33319
        versionName = "333.19"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseStoreFile.get())
                storePassword = releaseStorePassword.get()
                keyAlias = releaseKeyAlias.get()
                keyPassword = releaseKeyPassword.get()
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
                enableV4Signing = true
            }
        }
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }

        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )

            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
        warningsAsErrors = false
    }

    packaging {
        resources.excludes += setOf(
            "META-INF/DEPENDENCIES",
            "META-INF/LICENSE*",
            "META-INF/NOTICE*",
        )
    }
}

dependencies {
    // Stable Android Browser Helper. The launcher uses a TWA when Digital Asset Links verify,
    // otherwise it falls back to a Custom Tab. It never embeds the site in a WebView.
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.6.2")
}
