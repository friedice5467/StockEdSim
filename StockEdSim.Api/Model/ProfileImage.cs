namespace StockEdSim.Api.Model
{
    public class ProfileImage
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string DeleteHash { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;

        public virtual ApplicationUser User { get; set; }
    }
}
