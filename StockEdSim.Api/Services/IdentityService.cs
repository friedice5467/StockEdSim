using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using StockEdSim.Api.Db;
using StockEdSim.Api.Model;
using StockEdSim.Api.Services.Abstract;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;

namespace StockEdSim.Api.Services
{
    public class IdentityService : IIdentityService
    {
        private static readonly HttpClient _client = new();
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
                user = await _userManager.Users.Include(u => u.ProfileImage).FirstOrDefaultAsync(u => u.StudentId == model.Username);
            }
            else
            {
                user = await _userManager.Users.Include(u => u.ProfileImage).FirstOrDefaultAsync(u => u.Email == model.Username);
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
                authClaims.Add(new Claim("userClasses", classIdsString));
                authClaims.Add(new Claim("profileImgUrl", user.ProfileImage?.ImageUrl ?? string.Empty));
                authClaims.Add(new Claim("fullName", user.FullName ?? string.Empty));

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

        public async Task<ServiceResult<string>> UpdateNameAsync(string name, Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if(user == null)
                return ServiceResult<string>.Failure("User not found", statusCode: HttpStatusCode.NotFound);

            user.FullName = name;
            _dbContext.Users.Update(user);

            await _dbContext.SaveChangesAsync();
            
            return ServiceResult<string>.Success(data: user.FullName);
        }

        public async Task<ServiceResult<string>> UpdateProfileImg(IFormFile imageFile, Guid userId)
        {
            string imgurClientId = _configuration["Imgur:ClientId"];

            // Prepare the request headers
            _client.DefaultRequestHeaders.Clear();
            _client.DefaultRequestHeaders.Add("Authorization", "Client-ID " + imgurClientId);

            // Create MultipartFormDataContent and add the image stream
            using var content = new MultipartFormDataContent();
            using var imageStream = imageFile.OpenReadStream();
            content.Add(new StreamContent(imageStream), "image", imageFile.FileName);

            // Send the image to Imgur
            var response = await _client.PostAsync("https://api.imgur.com/3/upload", content);
            if (!response.IsSuccessStatusCode)
            {
                return ServiceResult<string>.Failure("Failed to upload image to Imgur", statusCode: HttpStatusCode.InternalServerError);
            }
            var getContent = await response.Content.ReadAsStringAsync();
            var imageResponse = JsonConvert.DeserializeObject<ImageResponse>(getContent);
            var imgUrl = imageResponse.Data.Link;
            var delHash = imageResponse.Data.Deletehash;

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult<string>.Failure("User not found", statusCode: HttpStatusCode.NotFound);

            if (user.HasImage)
            {
                var profileImg = await _dbContext.ProfileImages.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profileImg != null)
                {
                    await _client.DeleteAsync($"https://api.imgur.com/3/image/{profileImg.DeleteHash}");
                    _dbContext.ProfileImages.Remove(profileImg);
                }
                    
            }

            if (!user.HasImage)
            {
                user.HasImage = true;
                _dbContext.Users.Update(user);
            }

            ProfileImage newImg = new ProfileImage() { UserId = userId, ImageUrl = imgUrl, DeleteHash = delHash, Id = Guid.NewGuid() };
            await _dbContext.ProfileImages.AddAsync(newImg);

            await _dbContext.SaveChangesAsync();

            return ServiceResult<string>.Success(data: imgUrl);
        }

    }
}
