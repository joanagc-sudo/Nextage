

const urlAtual = window.location.pathname;

const links = document.querySelectorAll("nav a");

links.forEach(link => {

    const urlLink = link.getAttribute("href");

    if (urlLink === urlAtual) {

        link.classList.add("ativo");

    }

});

const botaoUsuario =
    document.getElementById("botaoUsuario");

const menuUsuario =
    document.getElementById("menuUsuario");


botaoUsuario.addEventListener("click", function(event) {

    event.stopPropagation();

    menuUsuario.classList.toggle("aberto");

});

document.addEventListener("click", function(event) {

    if (
        !menuUsuario.contains(event.target) &&
        !botaoUsuario.contains(event.target)
    ) {

        menuUsuario.classList.remove("aberto");

    }

});


document
    .getElementById("trocarConta")
    .addEventListener("click", function() {

        window.location.href = "/tela-login";

    });

const inputFoto =
    document.getElementById("inputFoto");

const fotoNavbar =
    document.getElementById("fotoPerfilNavbar");

const fotoMenu =
    document.getElementById("fotoPerfilMenu");

document
    .getElementById("alterarFoto")
    .addEventListener("click", function() {

        inputFoto.click();

    });

inputFoto.addEventListener("change", async function() {

    const arquivo = this.files[0];

    if (!arquivo) {
        return;
    }

    const formulario = new FormData();

    formulario.append("foto", arquivo);


    try {

        const resposta = await fetch(
            "/alterar-foto",
            {
                method: "POST",
                body: formulario
            }
        );


        const resultado =
            await resposta.json();


        if (resultado.sucesso) {
            fotoNavbar.src =
                resultado.foto;

            fotoMenu.src =
                resultado.foto;


        } else {

            alert(
                "Não foi possível alterar a foto."
            );

        }

    } catch (erro) {

        console.error(
            "Erro ao enviar foto:",
            erro
        );

        alert(
            "Erro ao enviar a foto."
        );

    }

});

document
    .getElementById("sair")
    .addEventListener("click", function() {

        window.location.href = "/logout";

    });

