export const CarSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '60819fc624dd2e0013421d44',
      description: 'ID del unidad'
    },
    vin: {
      type: 'string',
      example: 'JM7BP2H76N1119891',
      description: 'VIN del unidad'
    },
    patent: {
      type: 'string',
      example: 'ABC123',
      description: 'Patente del unidad'
    },
    type: {
      type: 'string',
      example: 'NEC',
      description: 'Tipo de unidad'
    },
    brand: {
      type: 'string',
      example: 'MAZDA',
      description: 'Marca de unidad'
    },
    denomination: {
      type: 'string',
      example: 'ALL NEW MAZDA3 SP V 2.0 7G 6MT',
      description: 'Modelo de unidad'
    },
    color: {
      type: 'string',
      example: 'BLANCO PERLA - MZ1',
      description: 'Color de unidad'
    }
  }
};
