export const PositionSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d933850ca2011a927f87',
      description: 'ID de la posición'
    },
    name: {
      type: 'string',
      example: 'FRONTAL',
      description: 'Nombre de la posición'
    }
  }
};
