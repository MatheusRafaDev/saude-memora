FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar arquivos de projeto para manter o restore cacheado.
COPY backend/SaudeMemora.slnx backend/
COPY backend/SaudeMemora.Api/SaudeMemora.Api.csproj backend/SaudeMemora.Api/
COPY backend/SaudeMemora.Application/SaudeMemora.Application.csproj backend/SaudeMemora.Application/
COPY backend/SaudeMemora.Domain/SaudeMemora.Domain.csproj backend/SaudeMemora.Domain/
COPY backend/SaudeMemora.Infrastructure/SaudeMemora.Infrastructure.csproj backend/SaudeMemora.Infrastructure/
RUN dotnet restore backend/SaudeMemora.Api/SaudeMemora.Api.csproj

# O catálogo ANVISA fica fora do diretório do backend e é incluído no contexto raiz.
COPY backend/ backend/
COPY data/anvisa/medicamentos.csv data/anvisa/medicamentos.csv
WORKDIR /src/backend/SaudeMemora.Api
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
