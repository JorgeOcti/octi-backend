export const AccesorySchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '6058ae7a9b33c58664290bed',
      description: 'ID del accesorio'
    },
    item: {
      type: 'string',
      example: 'BOTIQUÍN DE AUXILIO',
      description: 'Nombre del accesorio'
    },
    amount: {
      type: 'boolean',
      description: 'Indica si necesita ingresar una cantidad cuando se elige el accesorio'
    }
  }
};
