# Build Aşaması
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyasını kopyala ve bağımlılıkları restore et
COPY ["PodcastAPI.csproj", "./"]
RUN dotnet restore "PodcastAPI.csproj"

# Tüm kaynak kodları kopyala ve Release modunda publish et
COPY . .
RUN dotnet publish "PodcastAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Aşaması
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# .NET varsayılan portu üzerinden expose et
EXPOSE 8080
ENTRYPOINT ["dotnet", "PodcastAPI.dll"]