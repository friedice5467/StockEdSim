# Build stage
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

# Copy only necessary csproj files and restore the required projects
COPY ["Webjobs/Webjobs.csproj", "Webjobs/"]
COPY ["StockEdSim.Api/StockEdSim.Api.csproj", "StockEdSim.Api/"]
RUN dotnet restore "Webjobs/Webjobs.csproj"
RUN dotnet restore "StockEdSim.Api/StockEdSim.Api.csproj"

# Copy the entire solution and build the Webjobs project
COPY . .
WORKDIR "/src/Webjobs"
RUN dotnet build "Webjobs.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
WORKDIR "/src/Webjobs"
RUN dotnet publish "Webjobs.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Webjobs.dll"]
