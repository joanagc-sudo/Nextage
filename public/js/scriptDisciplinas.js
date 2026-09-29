
document.addEventListener("DOMContentLoaded", function () {

    const disciplinas = document.querySelectorAll(".disciplina");

    disciplinas.forEach(function (disciplina) {

        disciplina.addEventListener("click", function () {

            const materia = disciplina.dataset.materia;

            const materiaCodificada = encodeURIComponent(materia);

            window.location.href =
                "/materiais?materia=" + materiaCodificada;

        });

    });

});
