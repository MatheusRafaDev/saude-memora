FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar a solution e projetos para restore cacheado
COPY backend/SaudeMemora.slnx backend/
COPY backend/SaudeMemora.Api/SaudeMemora.Api.csproj backend/SaudeMemora.Api/
COPY backend/SaudeMemora.Application/SaudeMemora.Application.csproj backend/SaudeMemora.Application/
COPY backend/SaudeMemora.Domain/SaudeMemora.Domain.csproj backend/SaudeMemora.Domain/
COPY backend/SaudeMemora.Infrastructure/SaudeMemora.Infrastructure.csproj backend/SaudeMemora.Infrastructure/
RUN dotnet restore backend/SaudeMemora.Api/SaudeMemora.Api.csproj

# Copiar o resto do código do backend e buildar
COPY backend/ backend/
WORKDIR /src/backend/SaudeMemora.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Configurar o Render para injetar a variável de ambiente PORT (padrão 8080) na ASPNETCORE_URLS
ENV PORT=8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:$PORT dotnet SaudeMemora.Api.dll"]
