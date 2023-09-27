using System.Net;

namespace StockEdSim.Api.Model
{
    public class ServiceResult<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public HttpStatusCode StatusCode { get; set; } = HttpStatusCode.OK;
        public string DataType
        {
            get
            {
                Type type = typeof(T);
                if (type.IsGenericType)
                {
                    string genericTypeName = type.GetGenericTypeDefinition().Name;
                    genericTypeName = genericTypeName.Substring(0, genericTypeName.IndexOf('`'));
                    string genericArgs = string.Join(", ", type.GetGenericArguments().Select(t => t.Name).ToArray());
                    return $"{genericTypeName}<{genericArgs}>";
                }
                else
                {
                    return type.Name;
                }
            }
        }

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
