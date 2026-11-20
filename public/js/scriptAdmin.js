document.addEventListener("DOMContentLoaded", function () {
    const btnBuscar = document.getElementById("btnBuscarQuestao");
    const campoId = document.getElementById("id_questao");

    if (btnBuscar && campoId) {
        btnBuscar.addEventListener("click", function (event) {
            event.preventDefault();

            const id = campoId.value.trim();

            if (!id || Number(id) <= 0) {
                alert("Digite um ID válido.");
                campoId.focus();
                return;
            }

            window.location.href = `/alterar-questoes/${id}`;
        });
    }

const formulario = document.getElementById("formAdminMaterial");
const tabela = document.getElementById("tabelaMateriaisAdmin");
const seletorConteudo = document.getElementById("conteudoMaterial");
const seletorDisciplina = document.getElementById("disciplinaMaterial");
const pesquisa = document.getElementById("pesquisarMaterial");

if (formulario && tabela && seletorConteudo && pesquisa) {

    let materiais = [];

    // Carrega as disciplinas e os conteúdos
    
    async function carregarOpcoes() {
        try {
            const resposta = await fetch("/admin/opcoes");

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar as opções.");
            }

            const conteudos = await resposta.json();

            seletorDisciplina.innerHTML =
                '<option value="">Selecione uma disciplina</option>';

            seletorConteudo.innerHTML =
                '<option value="">Selecione primeiro uma disciplina</option>';

            seletorConteudo.disabled = true;

            const disciplinas = [...new Set(
                conteudos.map(item => item.disciplina)
            )].sort();

            disciplinas.forEach(disciplina => {
                const opcao = document.createElement("option");
                opcao.value = disciplina;
                opcao.textContent = disciplina;

                seletorDisciplina.appendChild(opcao);
            });

            // Atualiza os conteúdos conforme a disciplina escolhida
            seletorDisciplina.addEventListener("change", function () {

                const disciplinaSelecionada = this.value;

                seletorConteudo.innerHTML =
                    '<option value="">Selecione um conteúdo</option>';

                if (!disciplinaSelecionada) {
                    seletorConteudo.disabled = true;
                    return;
                }

                const filtrados = conteudos.filter(item =>
                    item.disciplina === disciplinaSelecionada
                );

                filtrados.forEach(item => {
                    const opcao = document.createElement("option");

                    opcao.value = item.id_conteudo;
                    opcao.textContent = item.conteudo;

                    seletorConteudo.appendChild(opcao);
                });

                seletorConteudo.disabled = false;
            });

        } catch (erro) {
            console.error("Erro ao carregar disciplinas e conteúdos:", erro);
        }
    }

    // Busca todos os materiais
    async function carregarMateriais() {
        try {
            const resposta = await fetch("/admin/lista");

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os materiais.");
            }

            materiais = await resposta.json();

            mostrarMateriais(materiais);

        } catch (erro) {
            console.error("Erro ao carregar materiais:", erro);

            tabela.innerHTML = `
                <tr>
                    <td colspan="5">Erro ao carregar materiais.</td>
                </tr>
            `;
        }
    }

    // Mostra os materiais na tabela
    function mostrarMateriais(lista) {
        tabela.innerHTML = "";

        if (lista.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="5">Nenhum material encontrado.</td>
                </tr>
            `;
            return;
        }

        lista.forEach(material => {
            const linha = document.createElement("tr");

            const titulo = document.createElement("td");
            titulo.textContent = material.titulo;

            const disciplina = document.createElement("td");
            disciplina.textContent = material.disciplina || "Não informado";

            const autor = document.createElement("td");
            autor.textContent = material.autor;

            const data = document.createElement("td");
            data.textContent = material.data_publicacao;

            const acoes = document.createElement("td");

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.addEventListener("click", function () {
                excluirMaterial(material.id_material);
            });

            acoes.appendChild(botaoExcluir);

            linha.appendChild(titulo);
            linha.appendChild(disciplina);
            linha.appendChild(autor);
            linha.appendChild(data);
            linha.appendChild(acoes);

            tabela.appendChild(linha);
        });
    }

    // Cadastra um material
    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        const dados = new FormData(formulario);

        try {
            const resposta = await fetch("/admin", {
                method: "POST",
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Erro ao cadastrar material.");
                return;
            }

            alert(resultado.mensagem || "Material cadastrado com sucesso!");

            formulario.reset();

            await carregarMateriais();

        } catch (erro) {
            console.error("Erro ao cadastrar material:", erro);
            alert("Não foi possível cadastrar o material.");
        }
    });

    // Exclui um material
    async function excluirMaterial(id) {

        const confirmar = confirm(
            "Tem certeza de que deseja excluir este material?"
        );

        if (!confirmar) return;

        try {
            const resposta = await fetch(`/admin/${id}`, {
                method: "DELETE"
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Erro ao excluir material.");
                return;
            }

            alert(resultado.mensagem || "Material excluído com sucesso!");

            await carregarMateriais();

        } catch (erro) {
            console.error("Erro ao excluir material:", erro);
            alert("Não foi possível excluir o material.");
        }
    }

    // Pesquisa materiais pelo título
    pesquisa.addEventListener("input", function () {
        const termo = pesquisa.value.toLowerCase();

        const filtrados = materiais.filter(material =>
            material.titulo.toLowerCase().includes(termo)
        );

        mostrarMateriais(filtrados);
    });

    // Inicializa a página
    carregarOpcoes();
    carregarMateriais();
}

}); 

