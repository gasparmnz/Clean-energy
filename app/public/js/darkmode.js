const botao = document.getElementById("darkModeToggle");
const icon = document.getElementById("darkModeIcon");

if(botao){
    botao.addEventListener("click", function(e){
        e.preventDefault();

        document.body.classList.toggle("dark-mode");
        icon.classList.toggle("ativo");
    });
}