namespace StockEdSim.Api.Model.Dto
{
    public class ClassDTO
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; }
        public Guid TeacherId { get; set; }
        public decimal DefaultBalance { get; set; } = 20000.00M;
        public IEnumerable<ClassBalanceDTO> ClassBalances { get; set; }
        public IEnumerable<StockDTO> Stocks { get; set; }
        public IEnumerable<TransactionDTO> Transactions { get; set; }
    }
}
