namespace StockEdSim.Api.Model
{
    using Microsoft.AspNetCore.Identity;
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string? FullName { get; set; }
        public string? Role { get; set; } 
        public string StudentId { get; set; } = string.Empty;
        public double Balance { get; set; }
        public virtual ICollection<UserClass> UserClasses { get; set; } = new List<UserClass>();
        public virtual ICollection<Stock> Stocks { get; set; } = new List<Stock>();
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public virtual ICollection<Class> TaughtClasses { get; set; } = new List<Class>();
        public virtual ICollection<ClassBalance> ClassBalances { get; set; } = new List<ClassBalance>();

    }

}
