import fitz
import os

uploads_dir = r"c:\Users\Pichau\OneDrive\Pratica_POAS\backend\uploads"
pdfs = [
    "Tecnico_em_Informatica_para_Internet_2012-2013.pdf",
    "Têxtil__Projeto_pedagógico_de_curso_técnico_de_Nível_Médio_na_forma_Integrada_2023.pdf",
    "Vestuário__Projeto_pedagógico_de_curso_técnico_de_Nível_Médio_na_forma_Integrada_2023.pdf"
]

for pdf in pdfs:
    pdf_path = os.path.join(uploads_dir, pdf)
    if os.path.exists(pdf_path):
        txt_path = pdf_path.replace(".pdf", ".txt")
        print(f"Extracting {pdf} to {txt_path}...")
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Finished {pdf}")
    else:
        print(f"Not found: {pdf_path}")
