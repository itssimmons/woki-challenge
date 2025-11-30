enum HttpStatus {
  Ok = 200,
  NoContent = 204,

  BadRequest = 400,
  NotFound = 404,
  Conflict = 409,
  UnprocessableEntity = 422,

  InternalServerError = 500,
}

export default HttpStatus;
