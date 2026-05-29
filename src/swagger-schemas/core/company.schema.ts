export const CompanySchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      format: 'UUID',
      example: '5c1a80f84fba86565186a756',
      description: 'ID de la empresa'
    },
    name: {
      type: 'string',
      example: 'Octimize SpA',
      description: 'Nombre de la empresa'
    }
  }
};
