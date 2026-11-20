function mostrarAlerta(mensagem) {
    document.getElementById("alerta").textContent = mensagem;
    document.getElementById("alerta").hidden = false;
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

//filtro de nome
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

        //aviso
        if (!confirm(`Excluir o usuário "${nome}"? Essa ação não pode ser desfeita.`)) {
            return;
        }

        //chama metodo para excluir
        try {
            const resposta = await fetch(`/admin/usuarios/${id}`, { method: "DELETE" });
            const dados = await resposta.json();

            if (!resposta.ok) {
                return mostrarAlerta(dados.erro || "Erro ao excluir.");
            }

            botao.closest("tr").remove();
            mostrarAlerta("Usuário excluído com sucesso.");
        } catch (erro) {
            mostrarAlerta("Não foi possível conectar ao servidor.");
        }
    });
});

//cadastrar
document.getElementById("formNovoUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("erroModal").hidden = true;

    //informações do novo usuário
    const corpo = {
        nome: document.getElementById("novoNome").value.trim(),
        email: document.getElementById("novoEmail").value.trim(),
        senha: document.getElementById("novaSenha").value,
        dataNascimento: document.getElementById("novaData").value,
        tipo: document.getElementById("novoTipo").value
    };

    //post do usuario
    try {
        const resposta = await fetch("/admin/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            document.getElementById("erroModal").textContent = dados.erro || "Erro ao cadastrar.";
            document.getElementById("erroModal").hidden = false;
            return;
        }

        window.location.reload();
    } catch (erro) {
        document.getElementById("erroModal").textContent = "Não foi possível conectar ao servidor.";
        document.getElementById("erroModal").hidden = false;
    }
});
