export const FormSchema = {
  type: 'object',
  description: 'Form Object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: 'b938beb1bcb6493e8418a818a22256fd',
      description: 'ID del formulario'
    },
    name: {
      type: 'string',
      example: 'Entrega a cliente',
      description: 'Nombre del formulario'
    },
    action: {
      type: 'string',
      enum: ['delivery', 'shipping', 'reception'],
      description: 'Acción que realiza el formulario con la unidad'
    }
  }
};
