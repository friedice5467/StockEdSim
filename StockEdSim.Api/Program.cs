using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockEdSim.Api.Db;
using StockEdSim.Api.Model;
using StockEdSim.Api.Services.Abstract;
using StockEdSim.Api.Services;
using System.Text;
using StockEdSim.Api.Hubs;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using AspNetCoreRateLimit;
using StockEdSim.Api.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

var corsSettings = builder.Configuration.GetSection("CORS").Get<CorsSettings>();
corsSettings.Origins = builder.Configuration["CORS:Origins"]?.Split(',');
corsSettings.Methods = builder.Configuration["CORS:Methods"]?.Split(',');
corsSettings.Headers = builder.Configuration["CORS:Headers"]?.Split(',');

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins(corsSettings.Origins)
               .WithMethods(corsSettings.Methods)
               .WithHeaders(corsSettings.Headers)
               .AllowCredentials();
    });
});

var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
    x.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/markethub")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

//DI
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IMarketService, MarketService>();

//Middleware
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("RedisConnection")));
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));

// Load Redis stores
builder.Services.AddSingleton<IIpPolicyStore, RedisIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, RedisRateLimitCounterStore>();

// Load the policy from appsettings.json
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<MarketHub>("/markethub");
app.MapControllers();

app.Run();