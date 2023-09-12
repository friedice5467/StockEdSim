namespace StockEdSim.Api.Model
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public virtual ApplicationUser Student { get; set; }
        public string StockSymbol { get; set; }
        public decimal Amount { get; set; }  
        public decimal PriceAtTransaction { get; set; } 
        public DateTime TransactionDate { get; set; }
    }

}
