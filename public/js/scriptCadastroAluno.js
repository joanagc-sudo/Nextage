
function mostrarAlerta() {

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const dataNascimento =
        document.getElementById('dataNascimento').value;


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
