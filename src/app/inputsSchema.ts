import * as yup from 'yup';

export const AppListVenuesSchema = yup.object().shape({
  page: yup.number().min(1).notRequired(),
  pageSize: yup.number().min(1).max(100).notRequired(),
});

export type AppListVenues = yup.InferType<typeof AppListVenuesSchema>;

export const AppListCompaniesSchema = yup.object().shape({
  page: yup.number().min(1).notRequired(),
  pageSize: yup.number().min(1).max(100).notRequired(),
});

export type AppListCompanies = yup.InferType<typeof AppListCompaniesSchema>;

