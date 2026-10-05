<script>
    const abrir = document.getElementById("abrirLembrete");
    const novo = document.getElementById("novoLembrete");
    const input = document.getElementById("textoLembrete");
    const salvar = document.getElementById("salvarLembrete");
    const lista = document.getElementById("listaLembretes");

    abrir.addEventListener("click", () => {
        if (novo.style.display === "flex") {
            novo.style.display = "none";
        } else {
            novo.style.display = "flex";
            input.focus();
        }
    });

    salvar.addEventListener("click", adicionarLembrete);

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            adicionarLembrete();
        }
    });

    function adicionarLembrete() {

        const texto = input.value.trim();

        if (texto === "") return;

        const item = document.createElement("div");
        item.className = "item-lembrete";

        item.innerHTML = `
            <span>${texto}</span>
            <button class="apagar">
                <i class="bi bi-trash"></i>
            </button>
        `;

        item.querySelector(".apagar").addEventListener("click", () => {
            item.remove();
        });

        lista.appendChild(item);

        input.value = "";
        novo.style.display = "none";
    }
</script>
