export const KindSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d933850ca2011a927f80',
      description: 'ID del tipo'
    },
    name: {
      type: 'string',
      example: 'RAYADO',
      description: 'Nombre del tipo'
    }
  }
};
