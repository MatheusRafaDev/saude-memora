using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Threading.Tasks;

namespace SaudeMemora.Api.Filters;

public class GlobalValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        foreach (var argument in context.Arguments)
        {
            if (argument == null) continue;

            var type = argument.GetType();
            // Evita procurar validadores para tipos nativos ou serviços do framework
            if (type.IsPrimitive || type == typeof(string) || type.Namespace?.StartsWith("Microsoft") == true || type.Namespace?.StartsWith("System") == true)
                continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(type);
            var validator = context.HttpContext.RequestServices.GetService(validatorType) as IValidator;

            if (validator != null)
            {
                var validationContext = new ValidationContext<object>(argument);
                var validationResult = await validator.ValidateAsync(validationContext);

                if (!validationResult.IsValid)
                {
                    return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
                }
            }
        }

        return await next(context);
    }
}
