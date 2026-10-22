// Un error que ya sabe qué código HTTP le corresponde.
// Los servicios lanzan estos errores y el middleware de errores
// los convierte en { error: "mensaje" } con el código correcto.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// 400: los datos que mandó el cliente son inválidos
export const badRequest = (mensaje) => new HttpError(400, mensaje);

// 404: lo que se busca no existe
export const notFound = (mensaje) => new HttpError(404, mensaje);

// 409: los datos son válidos, pero chocan con una regla de negocio
export const conflict = (mensaje) => new HttpError(409, mensaje);
