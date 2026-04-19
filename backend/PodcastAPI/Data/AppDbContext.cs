using Microsoft.EntityFrameworkCore;
using PodcastAPI.Models;

namespace PodcastAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FullName).HasColumnName("fullname");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.PasswordHash).HasColumnName("passwordhash");
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.Occupation).HasColumnName("job");
            entity.Property(e => e.CreatedAt).HasColumnName("createdat");
        });
    }
}