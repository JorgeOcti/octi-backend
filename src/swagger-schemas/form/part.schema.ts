export const PartSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d932850ca2011a927f49',
      description: 'ID de la parte'
    },
    name: {
      type: 'string',
      example: 'PARACHOQUES DELANTERO',
      description: 'Nombre de la parte'
    }
  }
};
