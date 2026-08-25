"""
Script para extrair as matrizes curriculares dos PDFs usando pdfplumber (extração tabular).
Gera arquivos .md no mesmo formato de Eletrotécnica.
"""
import pdfplumber
import os
import re

UPLOADS = r"c:\Users\Pichau\OneDrive\Pratica_POAS\backend\uploads"

def clean(text):
    """Limpa e normaliza um texto de célula."""
    if text is None:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def is_discipline_name(text):
    """Verifica se o texto parece ser nome de disciplina (não numérico, não vazio, não cabeçalho)."""
    if not text:
        return False
    skip = [
        "disciplina", "aulas semanais", "carga horária", "hora/", "relógio", "aula",
        "núcleo estruturante", "núcleo tecnológico", "núcleo articulador",
        "subtotal", "total", "prática profissional", "modalidade", "período", "optativa",
        "carga-horária", "número de aulas", "série / ano", "1º", "2º", "3º", "4º",
        "hora", "técnico de nível", "forma integrada", "ifrn", "para comprovar",
        "código verificador", "página", "disiciplinas", "seminários", "ensino técnico",
        "ensino médio", "curso técnico"
    ]
    lower = text.lower()
    for s in skip:
        if lower.startswith(s):
            return False
    # Skip pure numbers
    if re.match(r'^[\d\s\-h/.,]+$', text):
        return False
    return len(text) > 2

def parse_value(val):
    """Retorna True se o valor indica que a disciplina é ministrada nesse período."""
    if val is None:
        return False
    v = val.strip().replace('\n', '').strip()
    if v in ['', '-', '–', '—']:
        return False
    # Numeric means it has classes
    if re.match(r'^\d+$', v):
        return int(v) > 0
    return False


def extract_textil():
    pdf_path = os.path.join(UPLOADS, "Têxtil__Projeto_pedagógico_de_curso_técnico_de_Nível_Médio_na_forma_Integrada_2023.pdf")
    doc = pdfplumber.open(pdf_path)

    # The matrix is on pages around 11-13 (0-indexed: 10-12)
    all_rows = []
    for page_num in range(len(doc.pages)):
        page = doc.pages[page_num]
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if row:
                    all_rows.append([clean(c) for c in row])

    # Discover discipline rows
    anos = {1: [], 2: [], 3: [], 4: []}
    current_section = None
    
    for row in all_rows:
        # Find the discipline name (first column)
        nome = row[0] if row else ""
        if not nome:
            continue
        
        lower_nome = nome.lower()
        if 'núcleo estruturante' in lower_nome:
            current_section = 'estruturante'
            continue
        elif 'núcleo tecnológico' in lower_nome:
            current_section = 'tecnologico'
            continue
        elif 'núcleo articulador' in lower_nome:
            current_section = 'articulador'
            continue
        elif 'subtotal' in lower_nome or 'total' in lower_nome:
            continue
        
        if current_section in ['estruturante', 'tecnologico'] and is_discipline_name(nome):
            # Try to find the 4 period columns
            # The columns vary but typically: name, period1, period2, period3, period4, hora_rel, hora_aula
            # Or: name, val1, val2, val3, val4, ...
            period_vals = []
            for i in range(1, min(5, len(row))):
                period_vals.append(parse_value(row[i]))
            
            # Pad if needed
            while len(period_vals) < 4:
                period_vals.append(False)
            
            for p in range(4):
                if period_vals[p]:
                    if nome not in anos[p+1]:
                        anos[p+1].append(nome)

    doc.close()
    return anos


def extract_vestuario():
    pdf_path = os.path.join(UPLOADS, "Vestuário__Projeto_pedagógico_de_curso_técnico_de_Nível_Médio_na_forma_Integrada_2023.pdf")
    doc = pdfplumber.open(pdf_path)

    all_rows = []
    for page_num in range(len(doc.pages)):
        page = doc.pages[page_num]
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if row:
                    all_rows.append([clean(c) for c in row])

    anos = {1: [], 2: [], 3: [], 4: []}
    current_section = None
    
    for row in all_rows:
        nome = row[0] if row else ""
        if not nome:
            continue
        
        lower_nome = nome.lower()
        if 'núcleo estruturante' in lower_nome:
            current_section = 'estruturante'
            continue
        elif 'núcleo tecnológico' in lower_nome:
            current_section = 'tecnologico'
            continue
        elif 'núcleo articulador' in lower_nome:
            current_section = 'articulador'
            continue
        elif 'subtotal' in lower_nome or 'total' in lower_nome:
            continue
        
        if current_section in ['estruturante', 'tecnologico'] and is_discipline_name(nome):
            period_vals = []
            for i in range(1, min(5, len(row))):
                period_vals.append(parse_value(row[i]))
            
            while len(period_vals) < 4:
                period_vals.append(False)
            
            for p in range(4):
                if period_vals[p]:
                    if nome not in anos[p+1]:
                        anos[p+1].append(nome)

    doc.close()
    return anos


def extract_informatica():
    pdf_path = os.path.join(UPLOADS, "Tecnico_em_Informatica_para_Internet_2012-2013.pdf")
    doc = pdfplumber.open(pdf_path)

    all_rows = []
    for page_num in range(len(doc.pages)):
        page = doc.pages[page_num]
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if row:
                    all_rows.append([clean(c) for c in row])

    anos = {1: [], 2: [], 3: [], 4: []}
    current_section = None
    
    for row in all_rows:
        nome = row[0] if row else ""
        if not nome:
            continue
        
        lower_nome = nome.lower()
        if 'núcleo estruturante' in lower_nome:
            current_section = 'estruturante'
            continue
        elif 'núcleo tecnológico' in lower_nome:
            current_section = 'tecnologico'
            continue
        elif 'núcleo articulador' in lower_nome:
            current_section = 'articulador'
            continue
        elif 'subtotal' in lower_nome or 'total' in lower_nome:
            continue
        elif 'prática profissional' in lower_nome or 'seminários' in lower_nome:
            current_section = None
            continue
        
        if current_section in ['estruturante', 'tecnologico', 'articulador'] and is_discipline_name(nome):
            # The Informatica PDF has a different format. Columns:
            # name, 1º sem aulas, 2º sem aulas, 1º sem aulas, 2º sem aulas, ... (8 sub-columns for 4 years x 2 semesters)
            # Then hora/aula and hora totals
            # We need to identify which year has values
            
            # Try approach: look at raw values and determine which year they map to
            # For this PDF format: columns after name are 1º,2º (year1), 1º,2º (year2), 1º,2º (year3), 1º,2º (year4), hora/aula, hora
            # So columns 1-2 = Year 1, 3-4 = Year 2, 5-6 = Year 3, 7-8 = Year 4
            
            if len(row) >= 9:  # 8 semester columns + name
                for year in range(4):
                    col1 = 1 + year * 2
                    col2 = 2 + year * 2
                    has_val = False
                    for ci in [col1, col2]:
                        if ci < len(row) and parse_value(row[ci]):
                            has_val = True
                            break
                    if has_val:
                        if nome not in anos[year+1]:
                            anos[year+1].append(nome)
            elif len(row) >= 5:
                # Fallback: first 4 numeric columns after name
                period_vals = []
                for i in range(1, min(5, len(row))):
                    period_vals.append(parse_value(row[i]))
                while len(period_vals) < 4:
                    period_vals.append(False)
                for p in range(4):
                    if period_vals[p]:
                        if nome not in anos[p+1]:
                            anos[p+1].append(nome)

    doc.close()
    return anos


def write_md(filename, curso_nome, anos):
    path = os.path.join(UPLOADS, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"# Matriz Curricular - {curso_nome}\n\n")
        f.write("*Baseado no Projeto Pedagógico de Curso.*\n\n")
        f.write("**Organização:** Regime seriado anual (Períodos de 1 a 4).\n\n")
        
        for ano_num in range(1, 5):
            disciplinas = anos.get(ano_num, [])
            f.write(f"## Período {ano_num} ({ano_num}º Ano)\n\n")
            for d in disciplinas:
                f.write(f"* {d}\n")
            f.write("\n---\n\n")
    
    print(f"[OK] Gerado: {path}")
    print(f"     Total de disciplinas:")
    for ano_num in range(1, 5):
        print(f"       {ano_num}º Ano: {len(anos.get(ano_num, []))} disciplinas")


if __name__ == "__main__":
    print("=" * 60)
    print("EXTRAÇÃO DE MATRIZES CURRICULARES")
    print("=" * 60)
    
    print("\n--- TÊXTIL ---")
    textil = extract_textil()
    for y in range(1, 5):
        print(f"  {y}º Ano: {textil[y]}")
    write_md("Matriz_Curricular_Textil.md", "Curso Técnico de Nível Médio em Têxtil", textil)
    
    print("\n--- VESTUÁRIO ---")
    vestuario = extract_vestuario()
    for y in range(1, 5):
        print(f"  {y}º Ano: {vestuario[y]}")
    write_md("Matriz_Curricular_Vestuario.md", "Curso Técnico de Nível Médio em Vestuário", vestuario)
    
    print("\n--- INFORMÁTICA PARA INTERNET ---")
    informatica = extract_informatica()
    for y in range(1, 5):
        print(f"  {y}º Ano: {informatica[y]}")
    write_md("Matriz_Curricular_Informatica.md", "Curso Técnico Integrado em Informática para Internet", informatica)
    
    print("\n" + "=" * 60)
    print("EXTRAÇÃO CONCLUÍDA!")
