using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockEdSim.Api.Model;
using StockEdSim.Api.Services.Abstract;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace StockEdSim.Api.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        public IdentityService(UserManager<ApplicationUser> userManager,
                               SignInManager<ApplicationUser> signInManager,
                               IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        public async Task<ServiceResult<string>> RegisterAsync(RegisterModel model)
        {
            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Username,
                StudentId = model.StudentId
            };

            var identityResult = await _userManager.CreateAsync(user, model.Password);

            if (identityResult.Succeeded)
            {
                var roleStr = string.IsNullOrEmpty(model.UsageKey) ? "Student" : "Teacher";
                await _userManager.AddToRoleAsync(user, roleStr);
                return ServiceResult<string>.Success("Registration successful!");
            }

            var errorMessage = string.Join("; ", identityResult.Errors.Select(e => e.Description));
            return ServiceResult<string>.Failure(errorMessage, data: null, statusCode: HttpStatusCode.InternalServerError);
        }

        public async Task<ServiceResult<string>> LoginAsync(LoginModel model)
        {
            ApplicationUser? user;

            if (model.IsStudentId)
            {
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.StudentId == model.Username);
            }
            else
            {
                user = await _userManager.FindByEmailAsync(model.Username);
            }

            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                var userRoles = await _userManager.GetRolesAsync(user);

                var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

                foreach (var userRole in userRoles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, userRole));
                }

                foreach (var userClass in user.UserClasses)
                {
                    authClaims.Add(new Claim("UserClass", userClass.ClassId.ToString()));
                }

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));

                var token = new JwtSecurityToken(
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
                return ServiceResult<string>.Success(data: tokenStr);
            }

            return ServiceResult<string>.Failure("Invalid login attempt.", data: null, statusCode: HttpStatusCode.Unauthorized);
        }
    }
}
