export const UserSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: 'b938beb1bcb6493e8418a818a22256fd',
      description: 'ID del usuario'
    },
    firstName: {
      type: 'string',
      example: 'Jhon',
      description: 'Nombre del usuario'
    },
    lastName: {
      type: 'string',
      example: 'Doe',
      description: 'Apellido del usuario'
    },
    email: {
      type: 'string',
      example: 'jdoe@example.com',
      description: 'Email del usuario'
    }
  }
};
