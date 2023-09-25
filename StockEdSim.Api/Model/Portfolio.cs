namespace StockEdSim.Api.Model
{
    public class Portfolio
    {
        public Guid Id { get; set; }
        public DateTime CalculatedDate { get; set; }
        public decimal Valuation { get; set; }

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; }
        public Guid ClassId { get; set; }
        public Class Class { get; set; }
    }
}
