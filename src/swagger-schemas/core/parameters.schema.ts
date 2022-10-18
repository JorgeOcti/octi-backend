export const PageSchema = {
  'name': 'page',
  'in': 'query',
  'description': 'Por defecto es 1, se utiliza para seleccionar la pagina a consultar.',
  'required': false,
  'schema': {
    'type': 'integer',
    'minimum': 1
    // 'format': 'int64'
  }
};

export const PageSizeSchema = (size: number) => ({
  'name': 'pageSize',
  'in': 'query',
  'description': `Por defecto es ${size}, se utiliza para seleccionar la cantidad de resultados por página a consultar.`,
  'required': false,
  'schema': {
    'type': 'integer',
    'minimum': 1,
    'maximum': size
    // 'format': 'int64'
  }
});

export const AuthorizationJWTSchema = {
  'name': 'Authorization',
  'in': 'header',
  'description': `Token de acceso.`,
  'required': true,
  'schema': {
    'type': 'string'
    // 'format': 'int64'
  }
};
