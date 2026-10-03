function confirmarPresenca() {

    const mensagem =
        "Olá! Quero confirmar minha presença no aniversário de 4 anos do Bernardo! 🎉🦸";

    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(mensagem);

    window.open(url, "_blank");
}