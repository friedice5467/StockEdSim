namespace StockEdSim.Api.Model.Dto
{
    public class StudentDTO
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; }
        public decimal Profit { get; set; }
        public int TransactionsCount { get; set; }
    }

}
