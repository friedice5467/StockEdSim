namespace StockEdSim.Api.Model
{
    public class RegisterModel
    {
        public required string Email { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public required string Password { get; set; }
        public string UsageKey { get; set; } = string.Empty;
    }
}
