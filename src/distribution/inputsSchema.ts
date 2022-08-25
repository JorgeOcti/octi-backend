import * as yup from 'yup';

const createTransmittalSchema = yup.object().shape({
  name: yup.string(),
  files: yup.array().of(yup.string()),
  type: yup.string().required(),
  transporter: yup.object({
    carrier: yup.string().required(),
    driver: yup.string().required(),
    patent: yup.string(),
  }),
  items: yup.array().of(yup.object({
    request: yup.string().nullable(true),
    requestItem: yup.string().nullable(true),
    observation: yup.string(),
    car: yup.object({
      _id: yup.string().required(),
      bl: yup.string(),
      client: yup.string().nullable(true),
    }).required(),
    destination: yup.string().required(),
    origin: yup.string().required()
  })).required()
});

export {
  createTransmittalSchema
};
