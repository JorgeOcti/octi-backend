const isContainerCode = (code: string): boolean => {
  // Container code has format ABCU123456-1, three letters, U , six digits, a dash and a digit
  const regex = /^[A-Z]{3}U\d{7}$/;
  return regex.test(code.replaceAll("-", "").trim());
}

export {
  isContainerCode
}
