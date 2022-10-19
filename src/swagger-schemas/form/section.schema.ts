export const SectionSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: 'b938beb1bcb6493e8418a818a22256fd',
      description: 'ID de la sección'
    },
    name: {
      type: 'string',
      example: 'Datos del cliente',
      description: 'Nombre de la sección'
    },
    answers: {
      type: 'array',
      description: 'Arreglo que contiene las respuestas de la sección',
      items: {
        '$ref': '#/components/schemas/Answer'
      }
    },
    order: {
      type: 'integer',
      format: 'int32',
      description: 'Orden de la sección',
      example: 1
    }
  }
};
