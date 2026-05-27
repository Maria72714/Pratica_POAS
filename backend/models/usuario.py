from banco import db
from flask_login import UserMixin

class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    matricula = db.Column(db.String(50), nullable=False, unique=True)
    senha = db.Column(db.String(255), nullable=False)