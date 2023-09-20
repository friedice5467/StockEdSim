﻿using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockEdSim.Api.Db;
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
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public IdentityService(UserManager<ApplicationUser> userManager,
                               SignInManager<ApplicationUser> signInManager,
                               IConfiguration configuration, AppDbContext dbContext)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        public async Task<ServiceResult<string>> RegisterAsync(RegisterModel model)
        {
            if (model.IsTeacher)
            {
                if (string.IsNullOrEmpty(model.UsageKey))
                {
                    return ServiceResult<string>.Failure("Usage key is required for teachers", data: null, statusCode: HttpStatusCode.BadRequest);
                }

                var apiKeyGuid = Guid.TryParse(model.UsageKey, out Guid parsedGuid) ? parsedGuid : Guid.Empty;
                var apiKey = await _dbContext.ApiKeys.FirstOrDefaultAsync(k => k.Id == apiKeyGuid);

                if (apiKey == null || apiKey.IsUsed)
                {
                    return ServiceResult<string>.Failure("Invalid or already used key", data: null, statusCode: HttpStatusCode.BadRequest);
                }

                apiKey.IsUsed = true;
                apiKey.UsedDate = DateTime.UtcNow;
                _dbContext.ApiKeys.Update(apiKey);
                await _dbContext.SaveChangesAsync();
            }

            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Username,
                StudentId = model.StudentId
            };

            var identityResult = await _userManager.CreateAsync(user, model.Password);

            if (identityResult.Succeeded)
            {
                var roleStr = model.IsTeacher ? "Teacher" : "Student";
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
                user.UserClasses = await _dbContext.UserClasses.Where(x => x.UserId == user.Id).ToListAsync();
                string classIdsString = string.Join(",", user.UserClasses.Select(x => x.ClassId.ToString()));
                authClaims.Add(new Claim("UserClasses", classIdsString));

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