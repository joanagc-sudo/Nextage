
function mostrarAlerta() {

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const dataNascimento =
        document.getElementById('dataNascimento').value;


    // Impede selecionar uma data de nascimento futura
    const campoData = document.getElementById("dataNascimento");

    if (campoData) {

        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        const dataAtual = `${ano}-${mes}-${dia}`;

        campoData.max = dataAtual;
    }

    
    fetch('http://localhost:8080/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome,
            email,
            senha,
            confirmarSenha,
            dataNascimento
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);


            const alerta = document.getElementById("alerta-sucesso");

            alerta.classList.remove("d-none");

            setTimeout(function () {
                window.location.href = "/tela-inicial";
            }, 500);
        });
}
