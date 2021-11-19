import * as yup from 'yup';

const createRequestSalfaParams = yup.object().shape({
  brand: yup.string().required(),
  denomination: yup.string().required(),
  material: yup.string().required(),
  sellerText: yup.string().required(),
  ['5bf2de35caf8ef7096105c21']: yup.string().required(),
  ['5bf2de35caf8ef7096105c22']: yup.string().required(),
  ['60b9232164adc90013a79b45']: yup.string().required(),
  ['6154722a94bba10012230aae']: yup.string().required()
});

export {
  createRequestSalfaParams
};
