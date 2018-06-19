var $password = $('#password');
var $password2 = $('#password2');
var $hasLetter = $('#has-letter ');
var $hasNumber = $('#has-number ');
var $length = $('#length ');
var $passwordRequirements = $('#password-requirements');
var $password2Requirements = $('#password-2-requirements');
var $btnChangePassword = $('#btn-change-password');
$password.on('focus', function () {
    console.log('focus');
    $passwordRequirements.css('display', 'block');
});
$password.on('blur', function () {
    $passwordRequirements.css('display', 'none');
    console.log('blur');
});
var passwordValid = [];
var password2Valid = false;
function canPass() {
    if (passwordValid.length === 3 && password2Valid) {
        $btnChangePassword.attr('disabled', false);
    }
    else {
        $btnChangePassword.attr('disabled', true);
    }
}
$password.on('keyup change', function (e) {
    var value = e.target.value;
    passwordValid = [];
    var letters = /[a-zA-Z]/g;
    if (value.match(letters)) {
        passwordValid.push(true);
        $hasLetter.removeClass('error');
        $hasLetter.addClass('success');
    }
    else {
        $hasLetter.removeClass('success');
        $hasLetter.addClass('error');
    }
    var numbers = /[0-9]/g;
    if (value.match(numbers)) {
        passwordValid.push(true);
        $hasNumber.removeClass('error');
        $hasNumber.addClass('success');
    }
    else {
        $hasNumber.removeClass('success');
        $hasNumber.addClass('error');
    }
    if (value.length >= 6) {
        passwordValid.push(true);
        $length.removeClass('error');
        $length.addClass('success');
    }
    else {
        $length.removeClass('success');
        $length.addClass('error');
    }
    var password2 = $password2.val();
    password2Valid = password2 === value;
    if (password2 && password2.length && !password2Valid) {
        $password2Requirements.css('display', 'block');
    }
    else {
        $password2Requirements.css('display', 'none');
    }
    canPass();
});
$password2.on('keyup change', function (e) {
    var value = e.target.value;
    password2Valid = $password.val() === value;
    if (value.length && !password2Valid) {
        $password2Requirements.css('display', 'block');
    }
    else {
        $password2Requirements.css('display', 'none');
    }
    canPass();
});
//# sourceMappingURL=recovery.js.map