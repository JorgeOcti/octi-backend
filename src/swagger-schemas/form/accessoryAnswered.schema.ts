export const AccessoryAnsweredSchema = {
  type: 'object',
  properties: {
    amount: {
      type: 'integer',
      example: 0,
      description: 'Indica cantidad de accesorios faltantes'
    },
    item: {
      type: 'string',
      example: '6058ae7a9b33c58664290bed',
      description: 'ID del accesorio seleccionado'
    }
  }
};
