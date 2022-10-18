import * as yup from 'yup';

export const FormListControls = yup.object().shape({
  page: yup.number().min(1).notRequired(),
  pageSize: yup.number().min(1).max(100).notRequired(),
});
