package com.bteam.ovs.demo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

public class DemoJsonLoader {

    private final ObjectMapper om;

    public DemoJsonLoader(ObjectMapper om) {
        this.om = om;
    }

    /**
     * resources 直下の JSON を読み込む。
     * 例: loadList("citizens.json", new TypeReference<List<CitizenJson>>() {})
     */
    public <T> T load(String classpathFile, TypeReference<T> type) {
        try (InputStream in = new ClassPathResource(classpathFile).getInputStream()) {
            return om.readValue(in, type);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to read " + classpathFile, e);
        }
    }

    /**
     * よくある読み込み（List）用の別名。意味的に分かりやすいので分けただけ。
     */
    public <T> T loadList(String classpathFile, TypeReference<T> type) {
        return load(classpathFile, type);
    }
}
