FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar arquivos de projeto para manter o restore cacheado.
COPY SaudeMemora.slnx ./
COPY SaudeMemora.Api/SaudeMemora.Api.csproj SaudeMemora.Api/
COPY SaudeMemora.Application/SaudeMemora.Application.csproj SaudeMemora.Application/
COPY SaudeMemora.Domain/SaudeMemora.Domain.csproj SaudeMemora.Domain/
COPY SaudeMemora.Infrastructure/SaudeMemora.Infrastructure.csproj SaudeMemora.Infrastructure/
RUN dotnet restore SaudeMemora.Api/SaudeMemora.Api.csproj

# Copiar o código e o catálogo ANVISA, ambos disponíveis no contexto backend/.
COPY . ./
WORKDIR /src/SaudeMemora.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD /bin/sh -c 'curl -fsS http://localhost:${PORT}/api/ping || exit 1'

USER app
ENTRYPOINT ["/bin/sh", "-c", "export ASPNETCORE_URLS=http://+:${PORT}; exec dotnet SaudeMemora.Api.dll"]
