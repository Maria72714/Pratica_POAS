from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    redirect,
    url_for
)

from flask_bcrypt import Bcrypt
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user
)

from dotenv import load_dotenv

from banco import db
from models.usuario import Usuario

import os

load_dotenv()

app = Flask(
    __name__,
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)
app.config['SECRET_KEY'] = 'pratica'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login_pagina'

@login_manager.user_loader
def load_user(id):

    return Usuario.query.get(int(id))

@app.route('/')
def home():

    return render_template('index.html')


@app.route('/dashboard')
@login_required
def dashboard():

    return render_template(
        'dashboard.html',
        usuario=current_user
    )
@app.route('/login')
def login_pagina():

    return render_template('login.html')


@app.route('/cadastro', methods=['POST'])
def cadastro():

    dados = request.json

    usuario_existente = Usuario.query.filter(
        (Usuario.email == dados['email']) |
        (Usuario.matricula == dados['matricula'])
    ).first()

    if usuario_existente:

        return jsonify({
            'erro': 'Usuário já cadastrado'
        }), 400

    senha_criptografada = bcrypt.generate_password_hash(
        dados['senha']
    ).decode('utf-8')

    usuario = Usuario(
        nome=dados['nome'],
        email=dados['email'],
        matricula=dados['matricula'],
        senha=senha_criptografada
    )

    db.session.add(usuario)

    db.session.commit()

    login_user(usuario)

    return jsonify({
        'redirect': '/dashboard'
    })


@app.route('/login', methods=['POST'])
def login():

    dados = request.json

    usuario = Usuario.query.filter_by(
        email=dados['email']
    ).first()

    if not usuario:

        return jsonify({
            'erro': 'Usuário não encontrado'
        }), 404

    senha_correta = bcrypt.check_password_hash(
        usuario.senha,
        dados['senha']
    )

    if not senha_correta:

        return jsonify({
            'erro': 'Senha inválida'
        }), 401

    login_user(usuario)

    return jsonify({
        'redirect': '/dashboard'
    })


@app.route('/logout')
@login_required
def logout():

    logout_user()

    return redirect(url_for('login_pagina'))


if __name__ == '__main__':

    app.run(debug=True)