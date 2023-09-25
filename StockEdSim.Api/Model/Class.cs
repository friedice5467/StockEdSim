namespace StockEdSim.Api.Model
{
    public class Class
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; }
        public Guid TeacherId { get; set; }
        public decimal DefaultBalance { get; set; } = 20000.00M;
        public virtual ApplicationUser Teacher { get; set; }
        public virtual ICollection<UserClass> UserClasses { get; set; } = new List<UserClass>();
        public virtual ICollection<ClassBalance> ClassBalances { get; set; } = new List<ClassBalance>();
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public virtual ICollection<Stock> Stocks { get; set; } = new List<Stock>();
        public virtual ICollection<Portfolio> Portfolios { get; set; } = new List<Portfolio>();
    }
}
