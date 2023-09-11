namespace StockEdSim.Api.Model
{
    public class DashboardData
    {
        public List<Stock> Stocks { get; set; }
        public List<Transaction> Transactions { get; set; }
        public List<Class> Classes { get; set; }
    }
}
