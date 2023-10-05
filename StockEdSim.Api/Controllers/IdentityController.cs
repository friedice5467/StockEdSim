using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockEdSim.Api.Model;
using StockEdSim.Api.Services.Abstract;
using System.Security.Claims;

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

        [Authorize]
        [HttpPatch("myprofile/updateName/{name}")]
        public async Task<IActionResult> UpdateName([FromRoute] string name)
        {
            if (!string.IsNullOrEmpty(name))
            {
                var result = await _identityService.UpdateNameAsync(name, GetUserGuid());

                if(result.IsSuccess)
                {
                    return Ok(result.Data);
                }
                return StatusCode((int)result.StatusCode, result.Message);
            }

            return BadRequest(new { Message = "Name is not valid" });  
        }

        [Authorize]
        [HttpPost("myprofile/updateImg")]
        public async Task<IActionResult> UpdateImg(IFormFile imageFile)
        {
            if (imageFile != null && imageFile.Length > 0)
            {
                var result = await _identityService.UpdateProfileImg(imageFile, GetUserGuid());

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }
                return StatusCode((int)result.StatusCode, result.Message);
            }

            return BadRequest(new { Message = "Uploaded file is not valid" });
        }


        private Guid GetUserGuid()
        {
            var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var check = Guid.TryParse(checkThis, out Guid userId);
            if (!check)
                throw new Exception("User does not exist");

            return userId;
        }
    }
}