function validarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
 
if (
    cpfLimpo == "0000000000" ||
    cpfLimpo == "1111111111" ||
    cpfLimpo == "2222222222" ||
    cpfLimpo == "3333333333" ||
    cpfLimpo == "4444444444" ||
    cpfLimpo == "5555555555" ||
    cpfLimpo == "6666666666" ||
    cpfLimpo == "7777777777" ||
    cpfLimpo == "8888888888" ||
    cpfLimpo == "9999999999"){
     return false;}
 
if (cpfLimpo.length !== 11){
    return false;}
   
    return true;
}
 
module.exports = {validarCPF}