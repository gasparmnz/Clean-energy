const botao = document.getElementById("darkModeToggle");
const icon = document.getElementById("darkModeIcon");

function ativarDarkMode(){
    document.body.classList.add("dark-mode");
    icon.src="/imagem/sol.png";
}

function desativarDarkMode(){
    document.body.classList.remove("dark-mode");
    icon.src="/imagem/darkmode.png";
}

if(localStorage.getItem("darkmode") === "ativo"){
    ativarDarkMode();
}

botao.addEventListener("click", function(e){
    e.preventDefault();

    if(document.body.classList.contains("dark-mode")){
        desativarDarkMode();
        localStorage.setItem("darkmode","desativado");
    }else{
        ativarDarkMode();
        localStorage.setItem("darkmode","ativo");
    }
});