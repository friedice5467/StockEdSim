namespace StockEdSim.Api.Model
{
    public class StudentData
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; }
        public double Profit { get; set; }
        public int TransactionsCount { get; set; }
    }

}
