using Microsoft.EntityFrameworkCore;
using PodcastAPI.Models;

namespace PodcastAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
}