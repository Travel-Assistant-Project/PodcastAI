using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("ai")]
    public async Task<IActionResult> TestAI()
    {
        using var client = new HttpClient();
        var response = await client.GetAsync("http://127.0.0.1:8000/test");
        var content = await response.Content.ReadAsStringAsync();
        return Ok(new { ai_response = content });
    }
}