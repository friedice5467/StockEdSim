using AspNetCoreRateLimit;
using StackExchange.Redis;
using System.Text.Json;

namespace StockEdSim.Api.Redis
{
    public class RedisIpPolicyStore : IIpPolicyStore
    {
        private readonly IDatabase _database;

        public RedisIpPolicyStore(IConnectionMultiplexer redis)
        {
            _database = redis.GetDatabase();
        }

        public async Task<IpRateLimitPolicies> GetAsync()
        {
            var policiesString = await _database.StringGetAsync("IpPolicies");
            if (string.IsNullOrEmpty(policiesString))
                return null;

            return JsonSerializer.Deserialize<IpRateLimitPolicies>(policiesString);
        }

        public void Remove()
        {
            _database.KeyDelete("IpPolicies");
        }

        public void Set(IpRateLimitPolicies policies)
        {
            var policiesString = JsonSerializer.Serialize(policies);
            _database.StringSet("IpPolicies", policiesString);
        }

        public async Task<bool> ExistsAsync(string id, CancellationToken cancellationToken)
        {
            return await _database.KeyExistsAsync(id);
        }

        public new async Task<IpRateLimitPolicies> GetAsync(string id, CancellationToken cancellationToken)
        {
            var policiesString = await _database.StringGetAsync(id);
            if (string.IsNullOrEmpty(policiesString))
                return null;

            return JsonSerializer.Deserialize<IpRateLimitPolicies>(policiesString);
        }

        public async Task RemoveAsync(string id, CancellationToken cancellationToken)
        {
            await _database.KeyDeleteAsync(id);
        }

        public async Task SetAsync(string id, IpRateLimitPolicies entry, TimeSpan? expirationTime, CancellationToken cancellationToken)
        {
            var policiesString = JsonSerializer.Serialize(entry);
            await _database.StringSetAsync(id, policiesString, expirationTime);
        }

        public Task SeedAsync()
        {
            return Task.CompletedTask;
        }
    }

}
