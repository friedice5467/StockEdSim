namespace StockEdSim.Api.Model.Dto
{
    public class TransactionDTO
    {
        public Guid Id { get; set; }
        public string StockSymbol { get; set; }
        public decimal Amount { get; set; }
        public decimal PriceAtTransaction { get; set; }
        public DateTime TransactionDate { get; set; }
        public TransactionType Type { get; set; }
        public decimal CurrentBalanceAfterTransaction { get; set; }
        public decimal? NetProfit { get; set; }
        public Guid StudentId { get; set; }
        public Guid ClassId { get; set; }
    }
}
