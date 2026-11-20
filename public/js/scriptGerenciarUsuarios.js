
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
