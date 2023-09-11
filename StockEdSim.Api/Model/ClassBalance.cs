namespace StockEdSim.Api.Model
{
    public class ClassBalance
    {
        public Guid Id { get; set; }
        public decimal Balance { get; set; }

        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        public Guid ClassId { get; set; }
        public virtual Class Class { get; set; }
    }

}
