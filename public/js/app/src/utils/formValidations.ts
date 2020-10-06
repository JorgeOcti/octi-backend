const inputStringRequired = (value: string) => (value && value.toString().trim().length ? undefined : 'Este campo es requerido');
const validEmailRequired = (value: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value) ? undefined : 'Este email no es valido';
const maxNumber = (max: number) => (value: number) => max < value ? `Debe ser menor a ${max}` : undefined;
export {
  inputStringRequired,
  validEmailRequired,
  maxNumber
}
