export const CarrierSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: 'b938beb1bcb6493e8418a818a22255fd',
      description: 'ID del transportista'
    },
    name: {
      type: 'string',
      example: 'TRANSPORTES SCHIAPPACASSE',
      description: 'Nombre del transportista'
    }
  }
};
