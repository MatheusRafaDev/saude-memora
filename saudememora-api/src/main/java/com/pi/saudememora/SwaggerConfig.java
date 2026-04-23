package com.pi.saudememora;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SaudeMemora API")
                        .description("API REST do sistema SaudeMemora — prontuários, fichas médicas, exames, receitas e documentos clínicos com OCR e IA.")
                        .version("0.0.1-SNAPSHOT"))
                .servers(List.of(
                        new Server().url("https://saude-memora.onrender.com").description("Produção"),
                        new Server().url("http://localhost:8080").description("Local")
                ));
    }
}