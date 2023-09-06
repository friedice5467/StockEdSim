namespace StockEdSim.Api.Model
{
    public class LoginModel
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
        public bool IsStudentId { get; set; }
    }
}
