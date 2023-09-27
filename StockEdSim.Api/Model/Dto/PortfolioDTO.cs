namespace StockEdSim.Api.Model.Dto
{
    public class PortfolioDTO
    {
        public Guid Id { get; set; }
        public DateTime CalculatedDate { get; set; }
        public decimal Valuation { get; set; }
        public Guid UserId { get; set; }
        public Guid ClassId { get; set; }
    }
}
