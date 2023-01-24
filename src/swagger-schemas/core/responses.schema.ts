export const PaginateSchema = (schema: string) => ({
  type: 'object',
  properties: {
    count: {
      type: 'integer',
      example: 91
    },
    pages: {
      type: 'integer',
      example: 10
    },
    hasPrevPage: {
      type: 'boolean',
      example: false
    },
    hasNextPage: {
      type: 'boolean',
      example: true
    },
    data: {
      type: 'array',
      items: {
        $ref: `#/components/schemas/${schema}`
      }
    },
    status: {
      type: 'integer',
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

export const ErrorSchema403 = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: 'No tienes permisos para esta operación.'
    },
    status: {
      type: 'integer',
      example: 403
    }
  }
};

export const ErrorSchema404 = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: 'No encontrado.'
    },
    status: {
      type: 'integer',
      example: 404
    }
  }
};
