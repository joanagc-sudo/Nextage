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
}); 