using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using PodcastAPI.Dto;

namespace PodcastAPI.Middlewares;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            // Hatayı backend tarafında konsola/loga yazdır (sunum sonrası incelemek için)
            logger.LogError(ex, "Sistemde beklenmeyen bir hata oluştu veya dış API çağrısı başarısız oldu.");

            await HandleExceptionAsync(context);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context)
    {
        // Mobil tarafın network katmanı patlamasın diye Status Code'u 200 (OK) dönebiliriz 
        // veya 503 (Service Unavailable) yapabiliriz. Sunum için 200 dönüp içindeki JSON ile yönetmek risksizdir.
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.OK;

        var response = new ErrorResponseDto
        {
            Success = false,
            Message = "Şu an bu işlemi gerçekleştiremiyoruz. Lütfen Explore sayfasındaki içeriklere göz atın.",
            Action = "REDIRECT_TO_EXPLORE" // Mobil taraf bu flag'i görüp yönlendirme yapacak
        };

        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}