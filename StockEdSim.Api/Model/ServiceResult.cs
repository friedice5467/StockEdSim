using System.Net;

namespace StockEdSim.Api.Model
{
    public class ServiceResult<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public HttpStatusCode StatusCode { get; set; } = HttpStatusCode.OK;

        public static ServiceResult<T> Success(string message = "", T data = default, HttpStatusCode statusCode = HttpStatusCode.OK)
        {
            return new ServiceResult<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data,
                StatusCode = statusCode
            };
        }

        public static ServiceResult<T> Failure(string message, T data = default, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        {
            return new ServiceResult<T>
            {
                IsSuccess = false,
                Message = message,
                Data = data,
                StatusCode = statusCode
            };
        }
    }

}
