export const VenueSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID de la sucursal'
    },
    name: {
      type: 'string',
      example: 'Los Leones',
      description: 'Nombre de la sucursal'
    },
    company: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b191a',
      description: 'ID de la empresa a la que pertenece la sucursal'
    }
  }
};
