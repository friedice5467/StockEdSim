using Microsoft.AspNetCore.Mvc;
using StockEdSim.Api.Model;
using StockEdSim.Api.Services.Abstract;


namespace StockEdSim.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IdentityController : ControllerBase
    {
        private readonly IIdentityService _identityService;

        public IdentityController(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register(RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Model state is not valid" });
            }

            var result = await _identityService.RegisterAsync(model);
            if (result.IsSuccess)
            {
                return StatusCode((int)result.StatusCode, result.Message);
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login(LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Model state is not valid" });
            }

            var result = await _identityService.LoginAsync(model);

            if (result.IsSuccess)
            {
                return Ok(new
                {
                    token = result.Data,
                    expiration = DateTime.Now.AddHours(3) 
                });
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }
    }
}