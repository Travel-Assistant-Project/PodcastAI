using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PodcastAPI.Data;
using PodcastAPI.Services;
using PodcastAPI.Models;

// 1. .env dosyasını en başta yükle
Env.Load();

var builder = WebApplication.CreateBuilder(args);

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// 5. Servis Kaydı (Dependency Injection)
builder.Services.AddScoped<ITokenService, TokenService>();

var app = builder.Build();

// 6. Middleware Sıralaması
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();