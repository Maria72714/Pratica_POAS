import os
import re
from typing import List, Dict, Any

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

def parse_eletrotecnica_md() -> List[Dict[str, Any]]:
    file_path = os.path.join(UPLOADS_DIR, "Matriz_Curricular_Eletrotecnica.md")
    if not os.path.exists(file_path):
        return []

    anos_dict: Dict[str, List[str]] = {}
    current_ano = None

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:
        line_str = line.strip()
        # Header for period/year like "## Período 1 (1º Ano)"
        ano_match = re.search(r"Período\s+\d+\s*\(([^)]+)\)", line_str, re.IGNORECASE)
        if ano_match:
            current_ano = ano_match.group(1).strip() # e.g. "1º Ano"
            if current_ano not in anos_dict:
                anos_dict[current_ano] = []
            continue

        if current_ano and line_str.startswith("* "):
            materia = line_str.lstrip("* ").strip()
            # Clean up trailing descriptions and markdown formatting
            materia = re.sub(r"\s*\*\(.*?\)\*", "", materia)
            materia = materia.replace("**", "").strip()
            if materia and materia not in anos_dict[current_ano]:
                anos_dict[current_ano].append(materia)

    result = []
    for ano_name, materias in anos_dict.items():
        result.append({
            "ano": ano_name,
            "disciplinas": materias
        })

    return result

def get_curriculos_catalog() -> List[Dict[str, Any]]:
    eletrotecnica_anos = parse_eletrotecnica_md()

    cursos = [
        {
            "id": "eletrotecnica",
            "nome": "Técnico em Eletrotécnica",
            "anos": eletrotecnica_anos or [
                {
                    "ano": "1º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura I", "Geografia I", "Física: mecânica clássica e termodinâmica",
                        "Química: Geral e Inorgânica", "Matemática I", "Filosofia I", "Educação Física I", "Arte I", "Sociologia I",
                        "Educação em Tecnologias Digitais", "Desenho CAD", "Eletricidade Básica", "Noções de Mecânica", "Circuitos Elétricos",
                        "Gestão e Empreendedorismo", "Eletrônica Digital", "Máquinas e Acionamentos Elétricos", "Instalações Elétricas de Baixa Tensão"
                    ]
                },
                {
                    "ano": "2º Ano",
                    "disciplinas": [
                        "Inglês I", "Língua Portuguesa e Literatura II", "Matemática II", "Geografia II",
                        "Física: eletromagnetismo, ondas, óptica e física moderna", "Química: Físico-química", "Arte II", "Sociologia II",
                        "Educação Física II", "Arte III", "Filosofia II", "Máquinas e Acionamentos Elétricos", "Instalações Elétricas de Baixa Tensão", "Eletrônica Analógica"
                    ]
                },
                {
                    "ano": "3º Ano",
                    "disciplinas": [
                        "Filosofia III", "Inglês II", "História e Cultura", "Biologia - Do Indivíduo ao Ambiente",
                        "Química: Orgânica e Meio Ambiente", "Matemática III", "Língua Portuguesa e Literatura III",
                        "Instalações Elétricas de Alta Tensão", "Sociologia do Trabalho", "Eficiência Energética e Qualidade de Energia",
                        "Eletrônica Industrial", "Medidas Elétricas", "Segurança do Trabalho", "Manutenção Elétrica", "Controles Lógicos Programáveis"
                    ]
                },
                {
                    "ano": "4º Ano",
                    "disciplinas": [
                        "Sociologia III", "Língua Portuguesa e Literatura IV", "História, Poder e Trabalho",
                        "Biologia Hereditariedade, Evolução e suas Tecnologias", "Inglês III", "Espanhol I", "Biologia - Vida e Diversidade", "Espanhol II",
                        "Tópicos em Energias Renováveis", "Filosofia, Ciência e Tecnologia Eixo Controle e Processos Industriais"
                    ]
                }
            ]
        },
        {
            "id": "informatica_internet",
            "nome": "Técnico em Informática para Internet",
            "anos": [
                {
                    "ano": "1º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura I", "Matemática I", "Física I", "Química I", "Biologia I",
                        "História I", "Geografia I", "Educação Física I", "Filosofia I", "Sociologia I",
                        "Lógica de Programação", "Fundamentos de Informática", "Design Web I", "Arquitetura de Computadores"
                    ]
                },
                {
                    "ano": "2º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura II", "Matemática II", "Física II", "Química II", "Biologia II",
                        "Inglês I", "Programação Orientada a Objetos", "Banco de Dados I", "Desenvolvimento Web I", "Design Web II"
                    ]
                },
                {
                    "ano": "3º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura III", "Matemática III", "História II", "Geografia II", "Inglês II",
                        "Desenvolvimento Web II", "Banco de Dados II", "Engenharia de Software", "Redes de Computadores"
                    ]
                },
                {
                    "ano": "4º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura IV", "Sociologia II", "Filosofia II", "Inglês III", "Espanhol I",
                        "Programação para Dispositivos Móveis", "Segurança da Informação", "Projeto Integrador Web"
                    ]
                }
            ]
        },
        {
            "id": "textil",
            "nome": "Técnico em Têxtil",
            "anos": [
                {
                    "ano": "1º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura I", "Matemática I", "Física I", "Química Geral", "Geografia I",
                        "História I", "Educação Física I", "Introdução à Tecnologia Têxtil", "Desenho Técnico Têxtil", "Fibras Têxteis"
                    ]
                },
                {
                    "ano": "2º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura II", "Matemática II", "Física II", "Inglês I", "Química Orgânica Têxtil",
                        "Fiação I", "Tecelagem I", "Malharia I", "Controle de Qualidade Têxtil"
                    ]
                },
                {
                    "ano": "3º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura III", "Matemática III", "Inglês II", "História II", "Geografia II",
                        "Beneficiamento Têxtil (Tingimento e Estamparia)", "Fiação II", "Tecelagem II"
                    ]
                },
                {
                    "ano": "4º Ano",
                    "disciplinas": [
                        "Sociologia II", "Filosofia II", "Inglês III", "Gestão da Produção Têxtil", "Manutenção de Equipamentos Têxteis", "Projeto Integrador Têxtil"
                    ]
                }
            ]
        },
        {
            "id": "vestuario",
            "nome": "Técnico em Vestuário",
            "anos": [
                {
                    "ano": "1º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura I", "Matemática I", "Física I", "Química I", "Geografia I",
                        "Desenho de Moda I", "Tecnologia dos Materiais do Vestuário", "Modelagem Plana I", "Costura I"
                    ]
                },
                {
                    "ano": "2º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura II", "Matemática II", "Física II", "Inglês I",
                        "Desenho de Moda II", "Modelagem Plana e Tridimensional II", "Costura II", "História da Moda"
                    ]
                },
                {
                    "ano": "3º Ano",
                    "disciplinas": [
                        "Língua Portuguesa e Literatura III", "Matemática III", "Inglês II", "História II",
                        "Modelagem Computacional CAD", "Planejamento e Controle da Produção no Vestuário", "Criação de Coleções"
                    ]
                },
                {
                    "ano": "4º Ano",
                    "disciplinas": [
                        "Sociologia II", "Filosofia II", "Inglês III", "Gestão de Qualidade no Vestuário", "Ergonomia e Segurança do Trabalho", "Projeto Integrador Vestuário"
                    ]
                }
            ]
        }
    ]

    return cursos
