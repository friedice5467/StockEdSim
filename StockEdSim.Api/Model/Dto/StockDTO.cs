namespace StockEdSim.Api.Model.Dto
{
    public class StockDTO
    {
        public string StockSymbol { get; set; }
        public decimal Amount { get; set; }
        public decimal PurchasePrice { get; set; }
        public DateTime PurchaseDate { get; set; }
        public Guid StudentId { get; set; }
        public Guid ClassId { get; set; }

    }
}
