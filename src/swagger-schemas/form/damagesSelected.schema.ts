export const DamagesSelectedSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID del daño registrado'
    },
    kind: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d933850ca2011a927f80',
      description: 'ID del tipo seleccionado'
    },
    part: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d932850ca2011a927f49',
      description: 'ID de la parte seleccionada'
    },
    position: {
      type: 'string',
      format: 'UUID',
      example: '5cd9d933850ca2011a927f87',
      description: 'ID de la posición seleccionada'
    },
    severity: {
      type: 'string',
      description: 'Severidad seleccionada, este campo es opcional y depende del campo requireSeverity del objeto Participant'
    },
    images: {
      type: 'array',
      desscription: 'Arreglo de imágenes que son evidencias del daño, este campo es opcional',
      items: {
        '$ref': '#/components/schemas/Image'
      }
    }
  }
};
