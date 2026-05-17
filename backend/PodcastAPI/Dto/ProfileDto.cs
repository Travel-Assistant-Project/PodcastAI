using System.ComponentModel.DataAnnotations;

namespace PodcastAPI.Dto;

public class UpdateProfileDto
{
    [Required(ErrorMessage = "Full Name is required.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Full Name must be between 3 and 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Range(7, 100, ErrorMessage = "Age must be between 7 and 100.")]
    public int? Age { get; set; }

    [StringLength(100, ErrorMessage = "Occupation cannot exceed 100 characters.")]
    public string? Occupation { get; set; }
}

public class ProfileDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Occupation { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}