export const PaginateSchema = (schema: string) => ({
  type: 'object',
  properties: {
    count: {
      integer: 'integer',
      example: 91
    },
    pages: {
      integer: 'integer',
      example: 10
    },
    hasPrevPage: {
      integer: 'boolean',
      example: false
    },
    hasNextPage: {
      integer: 'boolean',
      example: true
    },
    data: {
      type: 'array',
      items: {
        $ref: `#/components/schemas/${schema}`
      }
    },
    status: {
      integer: 'integer',
      example: 200
    }
  }
});

export const ListControlsSchema = PaginateSchema('Participant');
export const ListCompaniesSchema = PaginateSchema('Company');
export const ListVenuesSchema = PaginateSchema('Venue');

export const ErrorSchema400 = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: 'La página solicitada no existe.'
    },
    status: {
      type: 'integer',
      example: 400
    }
  }
};

export const ErrorSchema401 = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: 'Debes estar autenticado para este recurso.'
    },
    status: {
      type: 'integer',
      example: 401
    }
  }
};
