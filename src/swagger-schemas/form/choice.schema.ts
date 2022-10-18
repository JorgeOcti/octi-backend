export const ChoiseSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '607d88a349f5f35338136595',
      description: 'ID de la opción'
    },
    choice: {
      type: 'string',
      example: 'Cumple',
      description: 'Opción'
    },
    backgroundColor: {
      type: 'string',
      enum: ['blue', 'red', 'green', 'yellow'],
      description: 'Color de fondo de la opción, puede ser blue, red, green, yellow'
    },
    requireImage: {
      type: 'boolean',
      description: 'Indica si la opción requiere una imagen'
    },
    requireComment: {
      type: 'boolean',
      description: 'Indica si la opción requiere un comentario'
    },
    requireAccesories: {
      type: 'boolean',
      description: 'Indica si la opción requiere accesorios'
    },
    order: {
      type: 'integer',
      example: 1,
      description: 'Orden de la opción'
    }
  }
};
