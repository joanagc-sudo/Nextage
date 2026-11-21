//verifica se o usuário está logado
function exigirLogin(req, res, next) {

    if (!req.session.usuario) {
        return res.redirect("/tela-login");
    }

    next();
}

//verifica se o usuário é administrador
function exigirAdmin(req, res, next) {

    const usuario = req.session.usuario;
    const admin = req.session.admin;

    const ehAdmin =
        Boolean(admin) ||
        (usuario && Number(usuario.tipo_usuario) === 1);

    if (!ehAdmin) {

        if (!usuario && !admin) {
            return res.redirect("/admin/login");
        }

        return res.redirect("/tela-inicial?error=Acesso não autorizado.");
    }

    next();
}

module.exports = {
    exigirLogin,
    exigirAdmin
};