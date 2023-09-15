namespace StockEdSim.Api.Model
{
    public class ApiKey
    {
        public Guid Id { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UsedDate { get; set; }
    }
}
