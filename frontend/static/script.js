const formulario = document.getElementById('formulario')

formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

    const resposta = await fetch('/cadastro', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({

            nome: document.getElementById('nome').value,

            email: document.getElementById('email').value,

            matricula: document.getElementById('matricula').value,

            senha: document.getElementById('senha').value,

            tipo_usuario: document.getElementById('tipo_usuario').value
        })
    })

    const dados = await resposta.json()

    if(dados.redirect){

        window.location.href = dados.redirect
    }

    if(dados.erro){

        alert(dados.erro)
    }

})