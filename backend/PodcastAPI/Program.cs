using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using PodcastAPI.Data;
using PodcastAPI.Services;
using PodcastAPI.Services.AiService;
using Hangfire;
using Hangfire.PostgreSql;
using PodcastAPI.Services.External;
using PodcastAPI.Services.PodcastCovers;
using PodcastAPI.Services.Storage;

var builder = WebApplication.CreateBuilder(args);

// Local development can use a gitignored .env file. Deployed environments
// should provide the same values through their secret/configuration store.
var envFile = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envFile))
{
    Env.Load(envFile);
}

static string RequireEnvironmentVariable(string name, int minimumLength = 1)
{
    var value = Env.GetString(name)?.Trim();
    if (string.IsNullOrWhiteSpace(value) || value.Length < minimumLength)
    {
        throw new InvalidOperationException(
            $"Required environment variable {name} is missing or invalid.");
    }

    return value;
}

// Veritabanı bağlantı dizesi
var dbHost = RequireEnvironmentVariable("DB_HOST");
var dbPort = RequireEnvironmentVariable("DB_PORT");
var dbName = RequireEnvironmentVariable("DB_NAME");
var dbUser = RequireEnvironmentVariable("DB_USER");
var dbPassword = RequireEnvironmentVariable("DB_PASS");
var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Hangfire yapılandırması
builder.Services.AddHangfire(config => config
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));

// Arka plan işlerini işleyecek olan worker'ı başlat
builder.Services.AddHangfireServer();

// JWT Ayarları
var jwtSecret = RequireEnvironmentVariable("JWT_SECRET", minimumLength: 32);
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
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IPodcastCoverPoolService, PodcastCoverPoolService>();
builder.Services.AddSingleton<IPodcastCoverReadUrlService, PodcastCoverReadUrlService>();
builder.Services.AddSingleton<IPodcastCoverDisplayUrlResolver, PodcastCoverDisplayUrlResolver>();
builder.Services.AddSingleton<IProfilePhotoStorage, ProfilePhotoStorage>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Servis Kayıtları
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();
builder.Services.AddScoped<IPodcastGeneratorJob, PodcastGeneratorJob>();

// Listen Notes API — anahtar yoksa önerilerde yalnızca kullanıcı içeriği kullanılır.
var listenNotesKey = Env.GetString("LISTEN_NOTES_API_KEY")?.Trim();
if (string.IsNullOrEmpty(listenNotesKey))
{
    builder.Services.AddSingleton<IExternalPodcastService, NoOpExternalPodcastService>();
}
else
{
    builder.Services.AddHttpClient<IExternalPodcastService, ListenNotesService>(client =>
    {
        client.BaseAddress = new Uri("https://listen-api.listennotes.com/api/v2/");
        client.DefaultRequestHeaders.Add("X-ListenAPI-Key", listenNotesKey);
    });
}

// AI Microservice için HTTP istemcisi
var aiServiceSecret = RequireEnvironmentVariable("AI_SERVICE_SECRET", minimumLength: 32);
var aiServiceUrl = RequireEnvironmentVariable("AI_SERVICE_URL");
if (!Uri.TryCreate(aiServiceUrl, UriKind.Absolute, out var aiServiceBaseUri))
{
    throw new InvalidOperationException(
        "AI_SERVICE_URL must be a valid absolute URL.");
}

builder.Services.AddHttpClient<IAiServiceClient, AiServiceClient>(client =>
{
    client.BaseAddress = aiServiceBaseUri;
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
app.UseMiddleware<PodcastAPI.Middlewares.GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
