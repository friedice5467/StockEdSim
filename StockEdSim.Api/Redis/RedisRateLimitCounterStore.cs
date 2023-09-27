using AspNetCoreRateLimit;
using StackExchange.Redis;
using System.Text.Json;

namespace StockEdSim.Api.Redis
{
    public class RedisRateLimitCounterStore : IRateLimitCounterStore
    {
        private readonly IDatabase _database;

        public RedisRateLimitCounterStore(IConnectionMultiplexer redis)
        {
            _database = redis.GetDatabase();
        }

        public async Task<RateLimitCounter?> GetAsync(string id)
        {
            var counterString = await _database.StringGetAsync(id);
            if (string.IsNullOrEmpty(counterString))
                return null;

            return JsonSerializer.Deserialize<RateLimitCounter>(counterString);
        }

        public void Remove(string id)
        {
            _database.KeyDelete(id);
        }

        public void Set(string id, RateLimitCounter counter, TimeSpan expirationTime)
        {
            var counterString = JsonSerializer.Serialize(counter);
            _database.StringSet(id, counterString, expirationTime);
        }

        public new async Task<RateLimitCounter?> GetAsync(string id, CancellationToken cancellationToken)
        {
            var counterString = await _database.StringGetAsync(id);
            if (string.IsNullOrEmpty(counterString))
                return null;

            return JsonSerializer.Deserialize<RateLimitCounter>(counterString);
        }

        public async Task RemoveAsync(string id, CancellationToken cancellationToken)
        {
            await _database.KeyDeleteAsync(id);
        }
        public async Task<bool> ExistsAsync(string id, CancellationToken cancellationToken)
        {
            return await _database.KeyExistsAsync(id);
        }
        public async Task SetAsync(string id, RateLimitCounter? entry, TimeSpan? expirationTime, CancellationToken cancellationToken)
        {
            if (entry.HasValue)
            {
                var counterString = JsonSerializer.Serialize(entry.Value);
                await _database.StringSetAsync(id, counterString, expirationTime);
            }
        }
    }

}
