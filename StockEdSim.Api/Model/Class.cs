namespace StockEdSim.Api.Model
{
    public class Class
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; }
        public Guid TeacherId { get; set; }
        public virtual ApplicationUser Teacher { get; set; }
        public virtual ICollection<UserClass> UserClasses { get; set; } = new List<UserClass>();
    }
}
