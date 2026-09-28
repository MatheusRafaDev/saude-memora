FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar a solution e projetos para restore cacheado (dentro da pasta backend)
COPY SaudeMemora.slnx ./
COPY SaudeMemora.Api/SaudeMemora.Api.csproj SaudeMemora.Api/
COPY SaudeMemora.Application/SaudeMemora.Application.csproj SaudeMemora.Application/
COPY SaudeMemora.Domain/SaudeMemora.Domain.csproj SaudeMemora.Domain/
COPY SaudeMemora.Infrastructure/SaudeMemora.Infrastructure.csproj SaudeMemora.Infrastructure/
RUN dotnet restore SaudeMemora.Api/SaudeMemora.Api.csproj

# Copiar o resto do código do backend e buildar
COPY . ./
WORKDIR /src/SaudeMemora.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV PORT=8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:$PORT dotnet SaudeMemora.Api.dll"]
