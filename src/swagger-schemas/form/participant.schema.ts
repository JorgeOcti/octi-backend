export const ParticipantSchema = {
  type: 'object',
  description: 'Participant Object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: 'b938beb1bcb6493e8418a818a22256fd',
      description: 'ID del control'
    },
    name: {
      type: 'string',
      example: 'Entrega a cliente',
      description: 'Nombre del control'
    },
    number: {
      type: 'integer',
      format: 'int32',
      example: 63485,
      description: 'Número de control'
    },
    form: {
      '$ref': '#/components/schemas/Form',
      description: 'Formulario asociado al control'
    },
    car: {
      '$ref': '#/components/schemas/Car',
      description: 'Unidad controlada'
    },
    user: {
      '$ref': '#/components/schemas/User',
      description: 'Usuario que realiza el control'
    },
    venue: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID de la Sucursal donde se realizo el control'
    },
    carrierBy: {
      '$ref': '#/components/schemas/Carrier',
      description: 'Transportista que realiza el movimiento de la unidad'
    },
    receiveFrom: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID de la Sucursal a la que se envía la unidad'
    },
    sendTo: {
      type: 'string',
      format: 'UUID',
      example: '5b5f718ea9683b0c584b171d',
      description: 'ID de la Sucursal desde donde se recibe la unidad'
    },
    sections: {
      type: 'array',
      items: {
        '$ref': '#/components/schemas/Section'
      }
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación del control'
    },
    aiExtraction: {
      type: 'object',
      nullable: true,
      description: 'AI-extracted cargo summary from Gemini',
      properties: {
        elements: { type: 'integer', description: 'Number of cargo elements (pallets, vehicles, etc.)' },
        has_damage: { type: 'boolean', description: 'Whether damage was reported' },
        notes: { type: 'string', description: 'Additional details extracted from text' }
      }
    }
  }
};
