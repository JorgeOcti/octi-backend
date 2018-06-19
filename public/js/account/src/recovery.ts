const $password = $('#password');
const $password2 = $('#password2');
const $hasLetter = $('#has-letter ');
const $hasNumber = $('#has-number ');
const $length= $('#length ');
const $passwordRequirements = $('#password-requirements');
const $password2Requirements = $('#password-2-requirements');
const $btnChangePassword = $('#btn-change-password');


$password.on('focus', ()=>{
  console.log('focus')
  $passwordRequirements.css('display', 'block');
});

$password.on('blur', ()=>{
  $passwordRequirements.css('display', 'none');
  console.log('blur')
});

let passwordValid: boolean[] = [];
let password2Valid: boolean = false;

function canPass() {
  if (passwordValid.length === 3 && password2Valid) {
    $btnChangePassword.attr('disabled', false as any)
  } else {
    $btnChangePassword.attr('disabled', true as any)
  }
}

$password.on('keyup change', (e: JQuery.Event<HTMLInputElement>) => {
  const value = e.target.value;
  passwordValid = [];
  const letters = /[a-zA-Z]/g;
  if (value.match(letters)) {
    passwordValid.push(true);
    $hasLetter.removeClass('error');
    $hasLetter.addClass('success');
  } else {
    $hasLetter.removeClass('success');
    $hasLetter.addClass('error');
  }
  // Validate numbers
  const numbers = /[0-9]/g;
  if (value.match(numbers)) {
    passwordValid.push(true);
    $hasNumber.removeClass('error');
    $hasNumber.addClass('success');

  } else {
    $hasNumber.removeClass('success');
    $hasNumber.addClass('error');
  }

  // Validate length
  if (value.length >= 6) {
    passwordValid.push(true);
    $length.removeClass('error');
    $length.addClass('success');
  } else {
    $length.removeClass('success');
    $length.addClass('error');
  }
  const password2:string | null = $password2.val() as string;
  password2Valid = password2  === value;
  if (password2 && password2.length && !password2Valid) {
    $password2Requirements.css('display', 'block');
  } else {
    $password2Requirements.css('display', 'none');
  }
  canPass();
});

$password2.on('keyup change', (e: JQuery.Event<HTMLInputElement>) => {
  const value = e.target.value;
  password2Valid = $password.val() === value;
  if (value.length && !password2Valid) {
    $password2Requirements.css('display', 'block');
  } else {
    $password2Requirements.css('display', 'none');
  }
  canPass()
});
