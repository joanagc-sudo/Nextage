function mostrarAlerta(mensagem) {
    document.getElementById("alerta").textContent = mensagem;
    document.getElementById("alerta").hidden = false;
}

// mensagem tipo bootstrap
function mostrarMensagem(texto, tipo) {
    const container = document.getElementById("mensagem-json");

    if (!container) {
        console.error("Elemento mensagem-json não encontrado!");
        return;
    }

    container.innerHTML = "";

    const alerta = document.createElement("div");

    alerta.className = `alert alert-${tipo} d-flex align-items-center`;
    alerta.setAttribute("role", "alert");
    alerta.textContent = texto;

    container.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// modal
document.getElementById("btnNovoUsuario").addEventListener("click", () => {
    document.getElementById("formNovoUsuario").reset();
    document.getElementById("erroModal").hidden = true;
    document.getElementById("modalNovoUsuario").showModal();
});

document.getElementById("btnCancelar").addEventListener("click", () => {
    document.getElementById("modalNovoUsuario").close();
});

// filtro de nome
document.getElementById("busca").addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();

    document.querySelectorAll("#tabelaUsuarios tbody tr").forEach((linha) => {
        linha.hidden = !linha.textContent.toLowerCase().includes(termo);
    });
});

// excluir usuarios
document.querySelectorAll(".btn-excluir").forEach((botao) => {
    botao.addEventListener("click", async () => {
        const { id, nome } = botao.dataset;

        // aviso
        if (!confirm(`Excluir o usuário "${nome}"? Essa ação não pode ser desfeita.`)) {
            return;
        }

        // chama metodo para excluir
        try {
            const resposta = await fetch(`/admin/usuarios/${id}`, {
                method: "DELETE"
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                return mostrarMensagem(
                    dados.erro || "Erro ao excluir.",
                    "danger"
                );
            }

            botao.closest("tr").remove();

            mostrarMensagem("Usuário excluído com sucesso.", "success");

        } catch (erro) {
            mostrarMensagem(
                "Não foi possível conectar ao servidor.",
                "danger"
            );
        }
    });
});

// cadastrar
document.getElementById("formNovoUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    document.getElementById("erroModal").hidden = true;

    // informações do novo usuário
    const corpo = {
        nome: document.getElementById("novoNome").value.trim(),
        email: document.getElementById("novoEmail").value.trim(),
        senha: document.getElementById("novaSenha").value,
        dataNascimento: document.getElementById("novaData").value,
        tipo: document.getElementById("novoTipo").value
    };

    // verifica os campos obrigatórios
    if (!corpo.nome || !corpo.email || !corpo.senha || !corpo.dataNascimento) {
        document.getElementById("erroModal").textContent =
            "Preencha todos os campos.";

        document.getElementById("erroModal").hidden = false;
        return;
    }

    // verifica o formato do e-mail
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(corpo.email)) {
        document.getElementById("erroModal").textContent =
            "Informe um e-mail válido.";

        document.getElementById("erroModal").hidden = false;
        return;
    }

    // verifica se a data informada é válida
    const [ano, mes, dia] = corpo.dataNascimento.split("-").map(Number);
    const dataInformada = new Date(ano, mes - 1, dia);

    const dataValida =
        dataInformada.getFullYear() === ano &&
        dataInformada.getMonth() === mes - 1 &&
        dataInformada.getDate() === dia;

    if (!dataValida) {
        document.getElementById("erroModal").textContent =
            "Informe uma data de nascimento válida.";

        document.getElementById("erroModal").hidden = false;
        return;
    }

    // verifica se a data não está no futuro
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataInformada > hoje) {
        document.getElementById("erroModal").textContent =
            "A data de nascimento não pode ser futura.";

        document.getElementById("erroModal").hidden = false;
        return;
    }

    // verifica os requisitos da senha
    const senhaSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!senhaSegura.test(corpo.senha)) {
        document.getElementById("erroModal").textContent =
            "A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo.";

        document.getElementById("erroModal").hidden = false;
        return;
    }

    // post do usuario
    try {
        const resposta = await fetch("/admin/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            document.getElementById("erroModal").textContent =
                dados.erro || "Erro ao cadastrar.";

            document.getElementById("erroModal").hidden = false;
            return;
        }

        document.getElementById("modalNovoUsuario").close();
        document.getElementById("formNovoUsuario").reset();

        mostrarMensagem(
            dados.mensagem || "Usuário cadastrado com sucesso!",
            "success"
        );

    } catch (erro) {
        document.getElementById("erroModal").textContent =
            "Não foi possível conectar ao servidor.";

        document.getElementById("erroModal").hidden = false;
    }
});

// define a data máxima de nascimento
const campoData = document.getElementById("novaData");

if (campoData) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    campoData.max = `${ano}-${mes}-${dia}`;
}