# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-config resolves .env values by reflecting on the app's BuildConfig
# class (RNCConfigModuleImpl -> Class.forName(packageName + ".BuildConfig")).
# ProGuard renames that class, so every Config.* value silently reads back empty in
# release builds while debug works fine. These rules keep the class and its fields.
-keep class com.staffflow.attendance.BuildConfig { *; }
-keep class com.lugg.RNCConfig.** { *; }

# The lookup above also reads the build_config_package string resource.
-keepclassmembers class **.R$string { public static <fields>; }
