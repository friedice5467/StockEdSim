namespace StockEdSim.Api.Model
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public virtual ApplicationUser Student { get; set; }
        public string StockSymbol { get; set; }
        public double Amount { get; set; }  
        public double PriceAtTransaction { get; set; } 
        public DateTime TransactionDate { get; set; }
    }

}
