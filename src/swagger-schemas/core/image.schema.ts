export const ImageSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID de la imagen'
    },
    file: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://octi.octimize.cl/static/images/octimize_logo.svg',
          description: 'URL de la imagen'
        },
        name: {
          type: 'string',
          example: 'DRAW_20180808_125215385_-1568767428.jpg',
          description: 'Nombre de la imagen'
        },
        size: {
          type: 'integer',
          example: 102090,
          description: 'Tamaño de la imagen'
        },
        type: {
          type: 'string',
          example: 'image/jpeg',
          description: 'Tipo de la imagen'
        }
      }
    }
  }
};
