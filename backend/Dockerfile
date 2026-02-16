# ===== build stage =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY gradlew settings.gradle* build.gradle* gradle.properties* ./
COPY gradle ./gradle
RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew && ./gradlew --no-daemon -v

COPY src ./src
RUN ./gradlew --no-daemon clean bootJar

# ===== runtime stage =====
FROM eclipse-temurin:21-jre
WORKDIR /app

# Python環境と日本語フォント（Noto CJK）をインストール
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    fonts-noto-cjk \
 && rm -rf /var/lib/apt/lists/*

# ライブラリのインストール
COPY scripts/requirements.txt ./scripts/
RUN pip3 install --no-cache-dir -r ./scripts/requirements.txt --break-system-packages

# jarとスクリプトをコピー
COPY --from=build /app/build/libs/*.jar /app.jar
COPY scripts ./scripts

# グラフ保存ディレクトリ（後でボリュームとしてマウントする）
RUN mkdir -p /app/storage/charts && chmod 777 /app/storage/charts

# 環境変数のデフォルト値（EC2起動時に上書き可能にする）
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app.jar"]