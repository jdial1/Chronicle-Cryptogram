# kotlinx.serialization generates a synthetic Companion holding the serializer;
# R8 cannot see it is used and strips it, which fails at runtime rather than at
# build time -- the desk file and every content model would stop parsing.
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}
-if @kotlinx.serialization.Serializable class ** {
    static **$* *;
}
-keepclassmembers class <2>$<3> {
    kotlinx.serialization.KSerializer serializer(...);
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Compose keeps its own rules; nothing extra is needed for the UI.

# Line numbers make a Crashlytics stack trace readable while still obfuscating.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
