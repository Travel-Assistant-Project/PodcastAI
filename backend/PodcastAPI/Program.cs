using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Services;
using PodcastAPI.Services.AiService;
using Hangfire;
using Hangfire.PostgreSql;
using PodcastAPI.Services.External;

var builder = WebApplication.CreateBuilder(args);

// .env dosyasını yükle
Env.Load();

var envFile = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envFile)) Env.Load(envFile); else Env.Load();

// Veritabanı bağlantı dizesi
var connectionString = $"Host={Env.GetString("DB_HOST")};Port={Env.GetString("DB_PORT")};Database={Env.GetString("DB_NAME")};Username={Env.GetString("DB_USER")};Password={Env.GetString("DB_PASS")}";

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Hangfire yapılandırması
builder.Services.AddHangfire(config => config
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));

// Arka plan işlerini işleyecek olan worker'ı başlat
builder.Services.AddHangfireServer();

// JWT Ayarları
var jwtSecret = Env.GetString("JWT_SECRET");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = JwtSigningKeyHelper.CreateKey(jwtSecret),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Servis Kayıtları
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();
builder.Services.AddScoped<IPodcastGeneratorJob, PodcastGeneratorJob>();

// Listen Notes API için HttpClient ve Servis Kaydı
var listenNotesKey = Env.GetString("LISTEN_NOTES_API_KEY");
builder.Services.AddHttpClient<IExternalPodcastService, ListenNotesService>(client =>
{
    client.BaseAddress = new Uri("https://listen-api.listennotes.com/api/v2/");
    client.DefaultRequestHeaders.Add("X-ListenAPI-Key", listenNotesKey);
});

// AI Microservice için HTTP istemcisi
var aiServiceSecret = Env.GetString("AI_SERVICE_SECRET");
if (string.IsNullOrWhiteSpace(aiServiceSecret))
{
    throw new InvalidOperationException(
        "AI_SERVICE_SECRET .env'de tanımlı değil. ai-service ile aynı sırrı kullanmalı.");
}

builder.Services.AddHttpClient<IAiServiceClient, AiServiceClient>(client =>
{
    client.BaseAddress = new Uri(Env.GetString("AI_SERVICE_URL") ?? "http://localhost:8001");
    client.Timeout = TimeSpan.FromMinutes(5);
    client.DefaultRequestHeaders.Add("X-Internal-Secret", aiServiceSecret);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

// Hangfire Dashboard paneli (takip için /hangfire)
app.UseHangfireDashboard();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();