using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using PodcastAPI.Data;
using PodcastAPI.Services;
using PodcastAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// .env: her zaman proje kökünden (dotnet run bazen farklı cwd ile çalışır; yanlış DB'ye yazılıyor sanılıyor)
var envFile = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envFile))
    Env.Load(envFile);
else
    Env.Load();

// 2. .env dosyasından veritabanı bilgilerini çek
var dbHost = Env.GetString("DB_HOST");
var dbPort = Env.GetString("DB_PORT");
var dbName = Env.GetString("DB_NAME");
var dbUser = Env.GetString("DB_USER");
var dbPass = Env.GetString("DB_PASS");

var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPass}";

// 3. Veritabanı Bağlantısını (PostgreSQL) Kaydet
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 4. JWT Ayarlarını Yapılandır
var jwtSecret = Env.GetString("JWT_SECRET");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
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

// 5. Servis Kaydı (Dependency Injection)
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
startupLogger.LogInformation(
    "PostgreSQL bağlantısı: Host={Host}; Port={Port}; Database={Database}; User={User}",
    dbHost, dbPort, dbName, dbUser);

// 6. Middleware Sıralaması
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();