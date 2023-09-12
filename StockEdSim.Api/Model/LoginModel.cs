using Newtonsoft.Json;

namespace StockEdSim.Api.Model
{
    public class LoginModel
    {
        [JsonProperty("username")]
        public required string Username { get; set; }
        [JsonProperty("password")]
        public required string Password { get; set; }
        [JsonProperty("isStudentId")]
        public bool IsStudentId { get; set; }
    }
}
