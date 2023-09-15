namespace StockEdSim.Api.Model
{
    public class Stock
    {
        public Guid Id { get; set; }
        public string StockSymbol { get; set; }
        public decimal Amount { get; set; } 
        
        public Guid StudentId { get; set; } 
        public virtual ApplicationUser Student { get; set; }

        public Guid ClassId { get; set; }
        public virtual Class Class { get; set; }
    }

}
