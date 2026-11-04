// Gabarit for Android (Jetpack Compose): the library (gabarit), published by JitPack from the repository's tags
// (com.github.Masmarino:Gabarit:<tag>).
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Gabarit"
include(":gabarit")
