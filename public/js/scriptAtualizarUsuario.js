
const formulario = document.querySelector("form");

formulario.addEventListener("submit", function (event) {
    const senhaAtual = document.getElementById("senhaAtual").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    // verifica se a nova senha foi informada
    if (novaSenha.trim() !== "") {

        // verifica se a senha atual foi informada
        if (senhaAtual.trim() === "") {
            event.preventDefault();
            alert("Informe sua senha atual.");
            return;
        }

        // verifica os requisitos da nova senha
        const senhaSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!senhaSegura.test(novaSenha)) {
            event.preventDefault();
            alert("A nova senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo.");
            return;
        }

        // verifica se as senhas são iguais
        if (novaSenha !== confirmarSenha) {
            event.preventDefault();
            alert("A confirmação da senha não corresponde à nova senha.");
            return;
        }
    } else if (confirmarSenha.trim() !== "") {
        event.preventDefault();
        alert("Informe a nova senha antes de confirmá-la.");
        return;
    }
});
