# ===== build stage =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Gradle wrapper & build config 먼저（キャッシュを効かせる）
COPY gradlew settings.gradle* build.gradle* gradle.properties* /app/
COPY gradle /app/gradle

# 依存解決（失敗しても後続で再実行される。キャッシュ目的）
RUN chmod +x /app/gradlew && ./gradlew --no-daemon -v

# ソースをコピーしてビルド
COPY src /app/src
RUN ./gradlew --no-daemon clean bootJar

# ===== runtime stage =====
FROM eclipse-temurin:21-jre
WORKDIR /app

# jar を配置（bootJarは通常 build/libs/*.jar）
COPY --from=build /app/build/libs/*.jar /app/app.jar

ENV JAVA_OPTS=""
EXPOSE 8080

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
