export const AnswerSchema ={
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            format: 'UUID',
            example: 'b938beb1bcb6493e8418a818a22256fd',
            description: 'ID de la respuesta',
          },
          question: {
            type: 'string',
            example: 'Nombre del cliente',
            description: 'Texto de la pregunta',
          },
          kind: {
            type: 'string',
            enum: ['scale', 'accessory', 'text', 'damage', 'carrier', 'image'],
            description: 'Tipo de pregunta, puede ser scale, accessory, text, damage, carrier, image',
          },
          answer: {
            type: 'string',
            example: 'b938beb1bcb6493e8418a818a22256fd',
            description: 'ID de la respuesta seleccionada, cuando la pregunta es de tipo scale o accessory',
          },
          comment: {
            type: 'string',
            example: 'Jhon Doe',
            description: 'Respuesta de la pregunta, cuando la pregunta es de tipo text',
          },
          images: {
            type: 'array',
            description: 'Imágenes adjuntas de la respuesta puede corresponder a las preguntas tipo scale o image',
            items: {
              '$ref': '#/components/schemas/Image'
            }
          },
          requireSeverity: {
            type: 'boolean',
            description: 'Indica si los daños requieren indicar su severidad',
          },
          damages: {
            type: 'object',
            description: 'Objeto que tiene las posiciones, tipo y partes a seleccionar para armar un daño, disponible en preguntas tipo damage',
            properties: {
              positions: {
                type: 'array',
                description: 'Arreglo que contiene las posiciones posibles para indicar daños',
                items: {
                  '$ref': '#/components/schemas/Position'
                }
              },
              kinds: {
                type: 'array',
                description: 'Arreglo que contiene los tipos de daños posibles para indicar daños',
                items: {
                  '$ref': '#/components/schemas/Kind'
                }
              },
              parts: {
                type: 'array',
                description: 'Arreglo que contiene las partes posibles para indicar daños',
                items: {
                  '$ref': '#/components/schemas/Part'
                }
              },
              severityOptions: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          damagesSelected: {
            type: 'array',
            description: 'Arreglo que contiene conjuntos de posiciones, tipos, partes y severidad reportados.',
            items: {
              '$ref': '#/components/schemas/DamageSelected'
            }
          },
          accesoriesAnswered: {
            type: 'array',
            description: 'Arreglo que contiene los _id de los accesorios seleccionados',
            items: {
              type: 'string',
              format: 'UUID',
              example: '6058ae7a9b33c58664390bed'
            }
          },
          scale: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                format: 'UUID',
                example: 'b938beb1bcb6493e8418a818a22256fd',
                description: 'ID de la escala',
              },
              name: {
                type: 'string',
                example: 'Escala de cumplimiento',
                description: 'Nombre de la escala',
              },
              choices: {
                type: 'array',
                description: 'Arreglo que contiene las opciones de la escala',
                items: {
                  '$ref': '#/components/schemas/Choice'
                }
              },
              minValue: {
                type: 'integer',
                description: 'Valor mínimo de la escala',
                example: 0
              },
              maxValue: {
                type: 'integer',
                description: 'Valor máximo de la escala',
                example: 3
              },
            }
          },
          accessories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  format: 'UUID',
                  example: '6058ae7a9b33c58664290bea',
                  description: 'ID del accesorio',
                },
                question: {
                  type: 'string',
                  example: '¿Qué elementos faltan?',
                  description: 'Pregunta que hace alusión a los accesorios',
                },
                items: {
                  type: 'array',
                  description: 'Arreglo que contiene los accesorios disponibles para responder',
                  items: {
                    '$ref': '#/components/schemas/Accessory'
                  }
                }
              }
            }
          },
          accesoriesSelected: {
            type: 'array',
            description: 'Arreglo que contiene los accesorios seleccionados, en la pregunta tipo accessory',
            items: {
              '$ref': '#/components/schemas/AccessorySelected'
            }
          },
          optional: {
            type: 'boolean',
            description: 'Indica si la pregunta es opcional',
          },
          order: {
            type: 'integer',
            format: 'int32',
            description: 'Orden de la pregunta',
            example: 1
          }
        }
      }
