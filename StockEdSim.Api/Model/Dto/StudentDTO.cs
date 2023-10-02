namespace StockEdSim.Api.Model.Dto
{
    public class StudentDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public decimal Profit { get; set; }
        public int TransactionsCount { get; set; }
        public string ProfileImg { get; set; }
        public int? Rank { get; set; }
        public List<PortfolioDTO> Portfolios { get; set; } = new();
    }

}
